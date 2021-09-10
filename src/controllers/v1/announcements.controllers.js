const mongoose = require('mongoose');
const validator = require('validator');
const createError = require('http-errors');
const sharp = require('sharp');

const Announcement = require('../../models/announcement.model');
const Image = require('../../models/image.model');
const client = require('../../db/redis.db');

const announcementsCache = require('../../util/announcementsCache');
const isStringArr = require('../../util/checkIsStringArr');

const ANNOUNCEMENTS_CACHE_EXPIRATION = parseInt(
  process.env.ANNOUNCEMENTS_CACHE_EXPIRATION
); // 1 day

const putNew = async (req, res, next) => {
  try {
    let { title, subtitle, description, description2, links } = req.body;
    const user = req.user;

    if (!title) return next(createError.BadRequest('Field title is required.'));
    if (!subtitle) subtitle = '';
    if (!description) description = '';
    if (!description2) description2 = '';

    if (links) {
      if (!Array.isArray(links)) {
        return next(
          createError.BadRequest('Links should be an array of strings.')
        );
      }
      if (!isStringArr(links)) {
        return next(
          createError.BadRequest('Links should be an array of strings.')
        );
      }
    }

    if (!isStringArr([title, subtitle, description, description2])) {
      return next(createError.BadRequest('Fields should be strings.'));
    }

    const announcement = new Announcement({
      title,
      subtitle,
      description,
      description2,
      links,
      owner: user._id,
      lastUpdatedBy: user._id,
    });

    await announcement.save();

    const date = new Date();
    date.setDate(date.getDate() - 1);

    const announcements = await Announcement.find({
      createdAt: {
        $gte: date,
      },
    })
      .sort({ createdAt: -1 })
      .exec();

    // Update 1 day ago cache
    client.SET(
      'ANNOUNCEMENTS',
      JSON.stringify(announcements),
      'EX',
      ANNOUNCEMENTS_CACHE_EXPIRATION
    );

    return res.status(201).json({
      success: true,
      Data: {
        message: 'Announcement created.',
        _id: announcement._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLatest = async (req, res, next) => {
  try {
    const latest = await Announcement.findOne({})
      .limit(1)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({
      success: true,
      Data: latest,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const fromDate = req.query.fromDate;

    let announcements;
    let date;

    if (fromDate) {
      if (!validator.isDate(fromDate)) {
        return next(
          createError.BadRequest('Please enter a valid date format.')
        );
      }

      // Get announcements from date specified and no cache
      date = new Date(fromDate);

      const announcementsDB = await Announcement.find({
        createdAt: {
          $gte: date,
        },
      })
        .lean()
        .sort({ createdAt: -1 })
        .exec();

      announcements = announcementsDB;
    } else {
      const announcementsCached = await announcementsCache();

      if (announcementsCached) {
        // Get announcements from 1 day ago (cached)
        announcements = JSON.parse(announcementsCached);
      } else {
        // Get announcements from 1 day ago
        date = new Date();
        date.setDate(date.getDate() - 1);

        const announcementsDB = await Announcement.find({
          createdAt: {
            $gte: date,
          },
        })
          .lean()
          .sort({ createdAt: -1 })
          .exec();

        announcements = announcementsDB;

        // Cache the results for subsequent use
        client.SET(
          'ANNOUNCEMENTS',
          JSON.stringify(announcementsDB),
          'EX',
          ANNOUNCEMENTS_CACHE_EXPIRATION
        );
      }
    }

    return res.json({
      success: true,
      Data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

const getId = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const announcement = await Announcement.findById(id).select('-_id').exec();

    if (!announcement) {
      return next(createError.NotFound('Announcement not found.'));
    }

    return res.json({
      success: true,
      Data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

const patchId = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let { title, subtitle, description, description2, links } = req.body;

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const announcement = await Announcement.findById(id).exec();

    if (!announcement) {
      return next(createError.NotFound('Announcement not found.'));
    }

    if (title) {
      if (typeof title !== 'string') {
        return next(createError.BadRequest('Fields should be strings.'));
      }

      announcement.title = title;
    }

    if (subtitle) {
      if (typeof subtitle !== 'string') {
        return next(createError.BadRequest('Fields should be strings.'));
      }

      announcement.subtitle = subtitle;
    }

    if (description) {
      if (typeof description !== 'string') {
        return next(createError.BadRequest('Fields should be strings.'));
      }

      announcement.description = description;
    }

    if (description2) {
      if (typeof description2 !== 'string') {
        return next(createError.BadRequest('Fields should be strings.'));
      }

      announcement.description2 = description2;
    }

    if (links) {
      if (!Array.isArray(links)) {
        return next(
          createError.BadRequest('Links should be an array of strings.')
        );
      }
      if (!isStringArr(links)) {
        return next(
          createError.BadRequest('Links should be an array of strings.')
        );
      }

      // Update links
      announcement.links = links;
    }

    announcement.lastUpdatedBy = req.user._id;

    await announcement.save();

    return res.json({
      success: true,
      Data: {
        message: 'Announcement updated.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const putImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError.BadRequest('No file provided.'));
    }

    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const announcement = await Announcement.findById(id).exec();

    if (!announcement) {
      return next(createError.NotFound());
    }

    if (announcement.image) {
      await Image.findByIdAndDelete(announcement.image).exec();
    }

    const buffer = await sharp(req.file.buffer)
      .jpeg({ quality: 100 })
      .toBuffer();

    const image = new Image({
      type: 'ANNOUNCEMENT',
      original: buffer,
    });
    announcement.image = image._id;
    announcement.lastUpdatedBy = req.user._id;

    await Promise.all([announcement.save(), image.save()]);

    return res.status(201).json({
      success: true,
      Data: {
        message: 'Cover updated.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const getImage = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const announcement = await Announcement.findById(id).exec();

    if (!announcement) {
      return next(createError.NotFound('Announcement could not be found.'));
    }

    if (!announcement.image) {
      return next(createError.NotFound('Announcement does not have an image.'));
    }

    const image = await Image.findById(announcement.image);

    res.set('Content-Type', 'image/jpeg');
    return res.send(image.original);
  } catch (error) {
    next(error);
  }
};

const delImage = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const announcement = await Announcement.findById(id).exec();

    if (!announcement) {
      return next(createError.NotFound('Announcement could not be found.'));
    }

    const imageId = announcement.image;

    announcement.image = undefined;

    await Promise.all([
      Image.findByIdAndRemove(imageId).exec(),
      announcement.save(),
    ]);

    return res.json({
      success: true,
      Data: {
        message: 'Image removed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const delId = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const announcement = await Announcement.findById(id).exec();

    if (!announcement) {
      return next(createError.NotFound('Announcement could not be found.'));
    }

    await announcement.remove();

    return res.json({
      success: true,
      Data: {
        message: 'Announcement removed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  putNew,
  getLatest,
  getAll,
  getId,
  patchId,
  putImage,
  getImage,
  delImage,
  delId,
};
