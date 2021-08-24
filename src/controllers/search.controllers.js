const createError = require('http-errors');

const User = require('../models/user.model');
const List = require('../models/list.model');

const getUsers = async (req, res, next) => {
  try {
    if (!req.query.q) {
      return next(createError.BadRequest('Please provide a query string.'));
    }

    if (req.query.q.length > 16) {
      return next(
        createError.BadRequest(
          'Query string cannot be longer than 16 characters.'
        )
      );
    }

    const result = await User.search(req.query.q, req.user._id);

    return res.json({
      success: true,
      Data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLists = async (req, res, next) => {
  try {
    if (!req.query.q) {
      return next(createError.BadRequest('Please provide a query string.'));
    }

    if (req.query.q.length > 25) {
      return next(
        createError.BadRequest(
          'Query string cannot be longer than 25 characters.'
        )
      );
    }

    const result = await List.search(req.query.q, req.user._id);

    return res.json({
      success: true,
      Data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getLists,
};
