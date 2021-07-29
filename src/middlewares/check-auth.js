const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    const tokenHeader = req.header('Authorization');
    const token = tokenHeader.split(' ')[1]; //Access token

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
      const user = await User.findOne({
        _id: decoded._id,
        accessTokens: {
          $in: [token],
        },
      }).exec();

      // if (!user) {
      //   req.user = user;
      //   req.token = token;
      //   next();
      // } else if (err.message === 'jwt expired') {
      //   return res.json({
      //     success: false,
      //     data: {
      //       message: 'Access token expired',
      //     },
      //   });
      // } else {
      //   console.log(err);
      //   return res.json({
      //     success: false,
      //     data: {
      //       error: err,
      //       message: 'User is not authenticated.',
      //     },
      //   });
      // }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
