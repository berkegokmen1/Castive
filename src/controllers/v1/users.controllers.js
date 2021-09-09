const sharp = require('sharp');
const createError = require('http-errors');

const User = require('../../models/user.model');
const Image = require('../../models/image.model');
const { updateProfileValidation } = require('../../util/formValidation');
const checkQuery = require('../../util/checkQuery');
const isNumeric = require('../../util/checkIsNumeric');
const client = require('../../db/redis.db');
const {
  checkGenreIdsCache,
  checkGenreIdsFormat,
} = require('../../util/checkGenreIds');
const {
  RPP_FOLLOWING_USER,
  RPP_BLOCKED_USER,
  RPP_LISTS_USER,
  RPP_LIBRARY_USER,
  RPP_FOLLOWERS_USER,
} = require('../../util/resultsPerPage');
const { sendVerificationMail } = require('../../util/mailer');

const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let result = user;

    const {
      following_page,
      followers_page,
      lists_page,
      blocked_page,
      library_page,
    } = req.query;

    [
      following_page,
      followers_page,
      lists_page,
      blocked_page,
      library_page,
    ].forEach((page) => {
      if (page) {
        if (!isNumeric(page)) {
          return next(
            createError.BadRequest('Page should be a positive integer or 0.')
          );
        }
      }
    });

    if (checkQuery(req.query.all)) {
      result = await user
        .populate({
          path: 'following',
          select: 'username -_id',
          options: {
            skip: following_page ? RPP_FOLLOWING_USER * following_page : 0,
            limit: following_page ? RPP_FOLLOWING_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate({
          path: 'blocked',
          select: 'username -_id',
          options: {
            skip: blocked_page ? RPP_BLOCKED_USER * blocked_page : 0,
            limit: blocked_page ? RPP_BLOCKED_USER : undefined,
          },
        })
        .populate({
          path: 'lists',
          select: '_id -owner title',
          options: {
            skip: lists_page ? RPP_LISTS_USER * lists_page : 0,
            limit: lists_page ? RPP_LISTS_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate({
          path: 'library',
          select: '_id title',
          options: {
            skip: library_page ? RPP_LIBRARY_USER * library_page : 0,
            limit: library_page ? RPP_LIBRARY_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate({
          path: 'followers',
          select: 'username -_id -following',
          options: {
            skip: followers_page ? RPP_FOLLOWERS_USER * followers_page : 0,
            limit: followers_page ? RPP_FOLLOWERS_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate('numFollowers')
        .execPopulate();
    } else {
      result = await user.populate('numFollowers').execPopulate();

      if (checkQuery(req.query.following)) {
        result = await result
          .populate({
            path: 'following',
            select: 'username -_id',
            options: {
              skip: following_page ? RPP_FOLLOWING_USER * following_page : 0,
              limit: following_page ? RPP_FOLLOWING_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }

      if (checkQuery(req.query.followers)) {
        result = await result
          .populate({
            path: 'followers',
            select: 'username -_id -following',
            options: {
              skip: followers_page ? RPP_FOLLOWERS_USER * followers_page : 0,
              limit: followers_page ? RPP_FOLLOWERS_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }

      if (checkQuery(req.query.lists)) {
        result = await result
          .populate({
            path: 'lists',
            select: '_id -owner title',
            options: {
              skip: lists_page ? RPP_LISTS_USER * lists_page : 0,
              limit: lists_page ? RPP_LISTS_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }

      if (checkQuery(req.query.blocked)) {
        result = await result
          .populate({
            path: 'blocked',
            select: 'username -_id',
            options: {
              skip: blocked_page ? RPP_BLOCKED_USER * blocked_page : 0,
              limit: blocked_page ? RPP_BLOCKED_USER : undefined,
            },
          })
          .execPopulate();
      }

      if (checkQuery(req.query.library)) {
        result = await result
          .populate({
            path: 'library',
            select: '_id title',
            options: {
              skip: library_page ? RPP_LIBRARY_USER * library_page : 0,
              limit: library_page ? RPP_LIBRARY_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }
    }

    return res.json({
      success: true,
      Data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getMeAvatar = async (req, res, next) => {
  try {
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

    if (!req.user.avatar) {
      return next(createError.NotFound('No avatar found.'));
    }

    let response;

    await req.user
      .populate({
        path: 'avatar',
        select: `${resolution} original _id`,
      })
      .execPopulate();

    response = req.user.avatar[resolution] || undefined;

    if (!response) {
      let buffer;

      if (resolution === 'medium') {
        buffer = await sharp(req.user.avatar.original)
          .resize({ width: 800, height: 800 })
          .jpeg({ quality: 75 })
          .toBuffer();
      } else if (resolution === 'small') {
        buffer = await sharp(req.user.avatar.original)
          .resize({ width: 600, height: 600 })
          .jpeg({ quality: 60 })
          .toBuffer();
      }

      const avatar = await Image.findById(req.user.avatar._id);
      avatar[resolution] = buffer;
      await avatar.save();

      response = buffer;
    }

    res.set('Content-Type', 'image/jpeg');
    return res.send(response);
  } catch (error) {
    return next(error);
  }
};

const putMeAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError.BadRequest('No file provided.'));
    }

    if (req.user.avatar) {
      await Image.findByIdAndRemove(req.user.avatar);
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 1200, height: 1200 })
      .jpeg({ quality: 100 })
      .toBuffer();

    const avatar = new Image({
      original: buffer,
    });
    req.user.avatar = avatar._id;

    await Promise.all([req.user.save(), avatar.save()]);

    return res.status(201).json({
      success: true,
      Data: {
        message: 'Avatar updated.',
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteMeAvatar = async (req, res, next) => {
  try {
    const imageId = req.user.avatar;

    req.user.avatar = undefined;

    await Promise.all([Image.findByIdAndRemove(imageId), req.user.save()]);

    return res.json({
      success: true,
      Data: {
        message: 'Avatar removed.',
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getMeInterests = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      Data: req.user.interests,
    });
  } catch (error) {
    next(error);
  }
};

const postMeInterests = async (req, res, next) => {
  // /me/inserests/:type/:incexc
  try {
    const { type, incexc } = req.params;
    const { ids } = req.body;

    if (!type || !incexc) {
      return next(
        createError.BadRequest('Please provide both type and include/exclude.')
      );
    }

    if (type.toLowerCase() !== 'tv' && type.toLowerCase() !== 'movie') {
      return next(createError.BadRequest("Type must be 'tv' or 'movie'"));
    }

    if (
      incexc.toLowerCase() !== 'include' &&
      incexc.toLowerCase() !== 'exclude'
    ) {
      return next(
        createError.BadRequest("Last param must be 'include' or 'exclude'")
      );
    }

    if (!ids) {
      return next(createError.BadRequest('Please provide ids.'));
    }

    if (!checkGenreIdsFormat(ids)) {
      return next(
        createError.BadRequest('ids should be an array of integers.')
      );
    }

    if (!(await checkGenreIdsCache(ids, type))) {
      return next(
        createError.BadRequest('ids should be valid according to tmdb.')
      );
    }

    const temp = req.user.interests[type][incexc];

    // Concat two arrays without duplicates
    for (var i = 0; i < ids.length; i++) {
      if (temp.indexOf(ids[i]) === -1) {
        temp.push(ids[i]);
      }
    }

    req.user.interests[type][incexc] = temp;

    await req.user.save();

    return res.json({
      success: true,
      Data: {
        message: 'Ids have been added.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteMeInterests = async (req, res, next) => {
  // /me/inserests/:type/:incexc
  try {
    const { type, incexc } = req.params;
    const { ids } = req.body;

    if (!type || !incexc) {
      return next(
        createError.BadRequest('Please provide both type and include/exclude.')
      );
    }

    if (type.toLowerCase() !== 'tv' && type.toLowerCase() !== 'movie') {
      return next(createError.BadRequest("Type must be 'tv' or 'movie'"));
    }

    if (
      incexc.toLowerCase() !== 'include' &&
      incexc.toLowerCase() !== 'exclude'
    ) {
      return next(
        createError.BadRequest("Last param must be 'include' or 'exclude'")
      );
    }

    if (!ids) {
      return next(createError.BadRequest('Please provide ids.'));
    }

    const temp = req.user.interests[type][incexc];

    req.user.interests[type][incexc] = temp.filter((id) => !ids.includes(id));

    await req.user.save();

    return res.json({
      success: true,
      Data: {
        message: 'Ids have been removed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Has some work to do
const patchMe = async (req, res, next) => {
  try {
    const user = req.user;

    const { email, birthdate } = req.body;

    if (!email && !birthdate) {
      return next(
        createError.BadRequest(
          'At least one field (email or birthdate) must be provided.'
        )
      );
    }

    const validationErrors = updateProfileValidation(email, birthdate);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        Data: {
          error: 'Validation Errors',
          validationErrors,
        },
      });
    }

    if (email) {
      if (email !== user.email.value) {
        // Check email uniqueness
        const emailCheck = await User.findOne({ 'email.value': email })
          .lean()
          .exec();
        if (emailCheck) {
          return next(createError.Conflict('Email already exists.'));
        }

        user.email.value = email;
        user.email.verified = false;

        sendVerificationMail(email);
      }
    }

    if (birthdate) {
      if (birthdate !== user.birthdate) {
        const oldDate = user.birthdate;

        user.birthdate = birthdate;

        if (user.age < 13) {
          user.birthdate = oldDate;
          return next(
            createError.Forbidden('Users under the age of 13 are not allowed.')
          );
        }
      }
    }

    await user.save();

    return res.json({
      success: true,
      Data: {
        message: 'Profile updated.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    await req.user.remove();

    // Delete all tokens belonging to the user
    client.KEYS(`*:*:${req.user._id.toString()}`, (err, reply) => {
      if (err) {
        return next(createError.InternalServerError());
      }
      client.DEL(reply, (err, reply) => {
        if (err) {
          return next(createError.InternalServerError());
        }

        return res.json({
          success: true,
          Data: {
            message: 'User removed.',
          },
        });
      });
    });
  } catch (error) {
    next(error);
  }
};
const getUserUsername = async (req, res, next) => {
  if (!req.params.username) {
    return next(createError.BadRequest('No username specified.'));
  }

  try {
    const username = req.params.username;

    const {
      following_page,
      followers_page,
      lists_page,
      blocked_page,
      library_page,
    } = req.query;

    [
      following_page,
      followers_page,
      lists_page,
      blocked_page,
      library_page,
    ].forEach((page) => {
      if (page) {
        if (!isNumeric(page)) {
          return next(
            createError.BadRequest('Page should be an positive integer or 0.')
          );
        }
      }
    });

    let user;

    user = await User.findOne({ username })
      .select('username subscription.status blocked following numFollowing')
      .populate('numFollowers')
      .exec();

    if (!user) {
      return next(createError.NotFound('User not found.'));
    }

    if (user.blocked.indexOf(req.user._id) > -1) {
      return next(createError.Forbidden());
    }

    if (checkQuery(req.query.all)) {
      user = await user
        .populate({
          path: 'following',
          select: 'username -_id',
          options: {
            skip: following_page ? RPP_FOLLOWING_USER * following_page : 0,
            limit: following_page ? RPP_FOLLOWING_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate({
          path: 'lists',
          select: '_id -owner title',
          options: {
            skip: lists_page ? RPP_LISTS_USER * lists_page : 0,
            limit: lists_page ? RPP_LISTS_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate({
          path: 'followers',
          select: 'username -_id -following',
          options: {
            skip: followers_page ? RPP_FOLLOWERS_USER * followers_page : 0,
            limit: followers_page ? RPP_FOLLOWERS_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate({
          path: 'library',
          select: '_id title',
          options: {
            skip: library_page ? RPP_LIBRARY_USER * library_page : 0,
            limit: library_page ? RPP_LIBRARY_USER : undefined,
            sort: { createdAt: -1 },
          },
        })
        .populate('numFollowers')
        .execPopulate();
    } else {
      if (checkQuery(req.query.following)) {
        user = await user
          .populate({
            path: 'following',
            select: 'username -_id',
            options: {
              skip: following_page ? RPP_FOLLOWING_USER * following_page : 0,
              limit: following_page ? RPP_FOLLOWING_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }

      if (checkQuery(req.query.followers)) {
        user = await user
          .populate({
            path: 'followers',
            select: 'username -_id -following',
            options: {
              skip: followers_page ? RPP_FOLLOWERS_USER * followers_page : 0,
              limit: followers_page ? RPP_FOLLOWERS_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }

      if (checkQuery(req.query.lists)) {
        user = await user
          .populate({
            path: 'lists',
            select: '_id -owner title',
            options: {
              skip: lists_page ? RPP_LISTS_USER * lists_page : 0,
              limit: lists_page ? RPP_LISTS_USER : undefined,
              sort: { createdAt: -1 },
            },
          })
          .execPopulate();
      }
    }

    const { blocked, ...rest } = user.toJSON();

    return res.json({
      success: true,
      Data: rest,
    });
  } catch (error) {
    next(error);
  }
};
const getUserUsernameAvatar = async (req, res, next) => {
  if (!req.params.username) {
    return next(createError.BadRequest('No username specified.'));
  }

  try {
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

    const username = req.params.username;
    const user = await User.findOne({ username })
      .select('avatar blocked')
      .exec(); // .lean() => does not work with binary for some reason

    if (!user) {
      return next(createError.NotFound('User not found.'));
    }

    if (user.blocked.indexOf(req.user._id) > -1) {
      return next(createError.Forbidden('Blocked.'));
    }

    if (!user.avatar) {
      return next(createError.NotFound('No avatar found.'));
    }

    let response;

    await user
      .populate({
        path: 'avatar',
        select: `${resolution} original _id`,
      })
      .execPopulate();

    response = user.avatar[resolution] || undefined;

    if (!response) {
      let buffer;

      if (resolution === 'medium') {
        buffer = await sharp(user.avatar.original)
          .resize({ width: 800, height: 800 })
          .jpeg({ quality: 75 })
          .toBuffer();
      } else if (resolution === 'small') {
        buffer = await sharp(user.avatar.original)
          .resize({ width: 600, height: 600 })
          .jpeg({ quality: 60 })
          .toBuffer();
      }

      const avatar = await Image.findById(user.avatar._id);
      avatar[resolution] = buffer;
      await avatar.save();

      response = buffer;
    }

    res.set('Content-Type', 'image/png');
    return res.send(response);
  } catch (error) {
    return next(error);
  }
};

const postFollow = async (req, res, next) => {
  if (!req.body.username) {
    return next(createError.BadRequest('No username specified.'));
  }

  if (typeof req.body.username !== 'string') {
    return next(createError.BadRequest());
  }

  try {
    const user = req.user;
    const username = req.body.username;

    if (user.username === username) {
      return next(createError.BadRequest());
    }

    const userToUse = await User.findOne({ username })
      .select('_id blocked')
      .exec();

    if (!userToUse) {
      return next(createError.NotFound('User not found.'));
    }

    if (userToUse.blocked.indexOf(user._id) !== -1) {
      return next(createError.Forbidden('Blocked.'));
    }

    if (user.blocked.indexOf(userToUse._id) > -1) {
      return next(createError.BadRequest(`${username} is blocked.`));
    }

    if (user.following.indexOf(userToUse._id) > -1) {
      return next(createError.BadRequest(`Already following ${username}.`));
    }

    user.following.push(userToUse._id);

    await user.save();

    return res.json({
      success: true,
      Data: {
        message: `Following ${username}.`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const postUnfollow = async (req, res, next) => {
  if (!req.body.username) {
    return next(createError.BadRequest('No username specified.'));
  }

  if (typeof req.body.username !== 'string') {
    return next(createError.BadRequest());
  }

  try {
    const user = req.user;
    const username = req.body.username;

    if (user.username === username) {
      return next(createError.BadRequest());
    }

    const userToUse = await User.findOne({ username })
      .select('_id blocked')
      .exec();

    if (!userToUse) {
      return next(createError.NotFound('User not found.'));
    }

    if (userToUse.blocked.indexOf(user._id) > -1) {
      return next(createError.Forbidden('Blocked.'));
    }

    // Check the userToUse id in the user following list
    const index = user.following.indexOf(userToUse._id);

    if (index === -1) {
      return next(createError.BadRequest(`Already not following ${username}`));
    }

    // Remove userToUse id from user following list
    user.following.splice(index, 1);

    await user.save();

    return res.json({
      success: true,
      Data: {
        message: `Unfollowed ${username}.`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const postBlock = async (req, res, next) => {
  if (!req.body.username) {
    return next(createError.BadRequest('No username specified.'));
  }

  if (typeof req.body.username !== 'string') {
    return next(createError.BadRequest());
  }

  try {
    const user = req.user;
    const username = req.body.username;

    if (user.username === username) {
      return next(createError.BadRequest());
    }

    const userToUse = await User.findOne({ username })
      .select('_id')
      .lean()
      .exec();

    if (!userToUse) {
      return next(createError.NotFound('User not found.'));
    }

    if (user.blocked.indexOf(userToUse._id) !== -1) {
      return next(createError.BadRequest(`${username} is already blocked.`));
    }

    // Check the userToUse id in the user following list
    const index = user.following.indexOf(userToUse._id);

    // Remove from following if exists
    if (index !== -1) {
      user.following.splice(index, 1);
    }

    user.blocked.push(userToUse._id);

    await user.save();

    return res.json({
      success: true,
      Data: {
        message: `Blocked ${username}.`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const postUnblock = async (req, res, next) => {
  if (!req.body.username) {
    return next(createError.BadRequest('No username specified.'));
  }

  if (typeof req.body.username !== 'string') {
    return next(createError.BadRequest());
  }

  try {
    const user = req.user;
    const username = req.body.username;

    if (user.username === username) {
      return next(createError.BadRequest());
    }

    const userToUse = await User.findOne({ username })
      .select('_id')
      .lean()
      .exec();

    if (!userToUse) {
      return next(createError.NotFound('User not found.'));
    }

    const index = user.blocked.indexOf(userToUse._id);

    if (index === -1) {
      return next(createError.BadRequest(`${username} is not blocked.`));
    }

    // Remove userToUse id from user blocked list
    user.blocked.splice(index, 1);

    await user.save();

    return res.json({
      success: true,
      Data: {
        message: `Unblocked ${username}.`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  getMeAvatar,
  putMeAvatar,
  deleteMeAvatar,
  getMeInterests,
  postMeInterests,
  deleteMeInterests,
  patchMe,
  deleteMe,
  getUserUsername,
  getUserUsernameAvatar,
  postFollow,
  postUnfollow,
  postBlock,
  postUnblock,
};
