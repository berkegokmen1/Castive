const User = require('../models/user.model');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../util/token-generator');

const { registerValidation } = require('../util/formValidation');

const putRegister = async (req, res, next) => {
  try {
    const { username, age, email, password, password2 } = req.body;

    const validationErrors = registerValidation(
      username,
      age,
      email,
      password,
      password2
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        data: {
          message: 'Error: Validation Errors.',
          validationErrors,
        },
      });
    } else {
      // Check username and email uniqueness
      const emailCheck = await User.findOne({ email });
      if (emailCheck) {
        const err = new Error('Email already exists.');
        err.statusCode = 400;
        throw err;
      }

      const usernameCheck = await User.findOne({ username });
      if (usernameCheck) {
        const err = new Error('Username is in use.');
        err.statusCode = 400;
        throw err;
      }
    }

    const newUser = new User({
      username,
      age,
      email,
      password,
    });

    const accessToken = generateAccessToken(newUser._id, email);
    newUser.accessTokens = newUser.accessTokens.concat(accessToken);

    const refreshToken = generateRefreshToken(newUser._id, email);
    newUser.refreshTokens = newUser.refreshTokens.concat(refreshToken);

    await newUser.save();

    return res.status(201).json({
      success: true,
      data: {
        username,
        email,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = error.statusCode ? error.statusCode : 500;
    next(err);
  }
};

const postLogin = (req, res, next) => {};
const postRefresh = (req, res, next) => {};
const postLogout = (req, res, next) => {};
const postLogoutAll = (req, res, next) => {};

module.exports = {
  putRegister,
  postLogin,
  postRefresh,
  postLogout,
  postLogoutAll,
};
