const jwt = require('jsonwebtoken');

const generateAccessToken = (id, email) => {
  const accessToken = jwt.sign(
    { _id: id.toString(), email: email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '10s' }
  );

  return accessToken;
};

const generateRefreshToken = (id, email) => {
  const refreshToken = jwt.sign(
    { _id: id.toString(), email: email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '365d' }
  );

  return refreshToken;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
