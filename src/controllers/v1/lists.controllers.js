const createError = require('http-errors');
const sharp = require('sharp');
const mongoose = require('mongoose');

const { listValidation } = require('../../util/formValidation');
const List = require('../../models/list.model');
const checkQuery = require('../../util/checkQuery');
const isNumeric = require('../../util/checkIsNumeric');

const {
  RPP_LISTS_USER,
  RPP_LIBRARY_USER,
  RPP_FOLLOWERS_LIST,
} = require('../../util/resultsPerPage');
const Image = require('../../models/image.model');

const getMe = async (req, res, next) => {
  try {
    const { page } = req.query;

    if (page) {
      if (!isNumeric(page)) {
        return next(
          createError.BadRequest('Page should be an positive integer or 0.')
        );
      }
    }

    const user = req.user;

    const result = await user
      .populate({
        path: 'lists',
        select: '_id title createdAt private',
        options: {
          skip: page ? RPP_LISTS_USER * page : 0,
          limit: page ? RPP_LISTS_USER : undefined,
        },
      })
      .execPopulate();

    return res.json({
      success: true,
      Data: result.lists,
    });
  } catch (error) {
    next(error);
  }
};

const postMe = async (req, res, next) => {
  try {
    const { title, description, private, items } = req.body;
    const user = req.user;

    if (!title) {
      return next(createError.BadRequest('Field title is required.'));
    }

    const validationErrors = listValidation(title, description, private);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        Data: {
          error: 'Validation Errors',
          validationErrors,
        },
      });
    }

    // Check items first
    const list = await user.addList(title, description, private, items);

    return res.status(201).json({
      success: true,
      Data: {
        message: 'List successfully created.',
        _id: list._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLibrary = async (req, res, next) => {
  try {
    const { page } = req.query;

    if (page) {
      if (!isNumeric(page)) {
        return next(
          createError.BadRequest('Page should be an positive integer or 0.')
        );
      }
    }

    const user = req.user;

    const result = await user
      .populate({
        path: 'library',
        select: '_id title',
        options: {
          skip: page ? RPP_LIBRARY_USER * page : 0,
          limit: page ? RPP_LIBRARY_USER : undefined,
        },
      })
      .execPopulate();

    return res.json({
      success: true,
      Data: result.library,
    });
  } catch (error) {
    next(error);
  }
};

const postLibrary = async (req, res, next) => {
  try {
    if (!req.body.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.body.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const list = await List.findById(id)
      .select('_id title owner private')
      .exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.private) {
      if (list.owner.toString() !== req.user._id.toString()) {
        return next(createError.NotFound());
      }
    }

    if (req.user.library.includes(list._id)) {
      return next(
        createError.BadRequest(
          `${list.title} has previously been added to the library.`
        )
      );
    }

    req.user.library.push(list._id);
    await req.user.save();

    return res.json({
      success: true,
      Data: {
        message: `${list.title} has been added to library.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteLibrary = async (req, res, next) => {
  try {
    if (!req.body.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.body.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const index = req.user.library.indexOf(id);

    if (index === -1) {
      return next(
        createError.NotFound('List could not be found in the library.')
      );
    }

    req.user.library.splice(index, 1);

    await req.user.save();

    return res.json({
      success: true,
      Data: {
        message: 'List has been removed from library.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const getList = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    const { page } = req.query;

    if (page) {
      if (!isNumeric(page)) {
        return next(
          createError.BadRequest('Page should be an positive integer or 0.')
        );
      }
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    let list;

    list = await List.findById(id)
      .select('title owner description private items')
      .populate('numFollowers');

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.private) {
      if (list.owner.toString() !== req.user._id.toString()) {
        return next(createError.NotFound());
      }
    }

    if (checkQuery(req.query.followers)) {
      list = await list
        .populate({
          path: 'followers',
          select: '_id username -library',
          options: {
            skip: page ? RPP_FOLLOWERS_LIST * page : 0,
            limit: page ? RPP_FOLLOWERS_LIST : undefined,
          },
        })
        .execPopulate();
    }

    return res.json({
      success: true,
      Data: list,
    });
  } catch (error) {
    return next(error);
  }
};

const patchList = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    const updates = Object.keys(req.body);
    if (updates.length === 0) {
      return next(createError.BadRequest('Please specify fields to update.'));
    }

    const allowedUpdates = ['title', 'description', 'private'];
    const isValid = updates.every((update) => allowedUpdates.includes(update));

    if (!isValid) {
      return next(createError.BadRequest('Invalid operation(s).'));
    }

    const { title, description, private } = req.body;

    const validationErrors = listValidation(title, description, private);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        Data: {
          error: 'Validation Errors',
          validationErrors,
        },
      });
    }

    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.owner.toString() !== req.user._id.toString()) {
      return next(createError.Forbidden());
    }

    // Update list
    if (title) {
      list.title = title;
    }

    if (description || description === '') {
      list.description = description;
    }

    if (private === true || private === false) {
      list.private = private;
    }

    await list.save();

    return res.json({
      success: true,
      Data: {
        message: 'List updated.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteList = async (req, res, next) => {
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

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.owner.toString() !== req.user._id.toString()) {
      return next(createError.Forbidden());
    }

    // Remove list
    await list.remove();

    return res.json({
      success: true,
      Data: {
        message: 'List removed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add validation to id of movie or tv series => tmdb
const postListItems = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    if (!req.body.id) {
      return next(createError.BadRequest('No movie or tv series id provided.'));
    }

    const idToAdd = req.body.id;
    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.owner.toString() !== req.user._id.toString()) {
      return next(createError.Forbidden());
    }

    if (list.items.includes(idToAdd)) {
      return next(
        createError.BadRequest('Id has previously been added to the list.')
      );
    }

    list.items.push(idToAdd);
    await list.save();

    return res.json({
      success: true,
      Data: {
        message: `${idToAdd} has been added to list ${list.title}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteListItems = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return next(createError.BadRequest('No id provided.'));
    }

    if (!req.body.id) {
      return next(createError.BadRequest('No movie or tv series id provided.'));
    }

    const idToRemove = req.body.id;
    let id;

    try {
      id = mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return next(createError.BadRequest('Please provide a valid id.'));
    }

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.owner.toString() !== req.user._id.toString()) {
      return next(createError.Forbidden());
    }

    const index = list.items.indexOf(idToRemove);

    if (index === -1) {
      return next(createError.NotFound('Item could not be found in the list.'));
    }

    list.items.splice(index, 1);

    await list.save();

    return res.json({
      success: true,
      Data: {
        message: 'Item has been removed from the list.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const getListCover = async (req, res, next) => {
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

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.private) {
      if (list.owner.toString() !== req.user._id.toString()) {
        return next(createError.NotFound());
      }
    }

    let resolution = req.query.resolution;

    if (!resolution) {
      resolution = 'original';
    } else {
      if (
        resolution != 'original' &&
        resolution != 'small' &&
        resolution != 'medium'
      ) {
        return next(createError.BadRequest('Resolution not found.'));
      }
    }

    if (!list.cover) {
      return next(createError.NotFound('Cover not found.'));
    }

    let response;

    await list
      .populate({
        path: 'cover',
        select: `${resolution} original _id`,
      })
      .execPopulate();

    response = list.cover[resolution] || undefined;

    if (!response) {
      let buffer;

      if (resolution === 'medium') {
        buffer = await sharp(list.cover.original)
          .resize({ width: 800, height: 800 })
          .jpeg({ quality: 75 })
          .toBuffer();
      } else if (resolution === 'small') {
        buffer = await sharp(list.cover.original)
          .resize({ width: 600, height: 600 })
          .jpeg({ quality: 60 })
          .toBuffer();
      }

      const cover = await Image.findById(list.cover._id);
      cover[resolution] = buffer;
      await cover.save();

      response = buffer;
    }

    res.set('Content-Type', 'image/jpeg');
    return res.send(response);
  } catch (error) {
    return next(error);
  }
};

const putListCover = async (req, res, next) => {
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

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.owner.toString() !== req.user._id.toString()) {
      return next(createError.Forbidden());
    }

    if (list.cover) {
      console.log(list.cover);
      await Image.findByIdAndRemove(list.cover);
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 1200, height: 1200 })
      .jpeg({ quality: 100 })
      .toBuffer();

    const cover = new Image({
      original: buffer,
    });
    list.cover = cover._id;

    await Promise.all([list.save(), cover.save()]);

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

const deleteListCover = async (req, res, next) => {
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

    const list = await List.findById(id).exec();

    if (!list) {
      return next(createError.NotFound('List could not be found.'));
    }

    if (list.owner.toString() !== req.user._id.toString()) {
      return next(createError.Forbidden());
    }

    const imageId = list.cover;

    list.cover = undefined;

    await Promise.all([Image.findByIdAndRemove(imageId), list.save()]);

    return res.json({
      success: true,
      Data: {
        message: 'Cover removed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  postMe,
  getLibrary,
  postLibrary,
  deleteLibrary,
  getList,
  patchList,
  deleteList,
  postListItems,
  deleteListItems,
  getListCover,
  putListCover,
  deleteListCover,
};
