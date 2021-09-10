const createError = require('http-errors');

const admin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(createError.Unauthorized());
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const moderator = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return next(createError.Unauthorized());
    }

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = { admin, moderator };
