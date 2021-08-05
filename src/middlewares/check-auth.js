const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
	const accessTokenHeader = req.header('Authorization');
	const accessToken = accessTokenHeader.split(' ')[1]; // Access token

	jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, payload) => {
		if (err) {
			const message =
				err.name === 'JsonWebTokenError' ? 'Unauthroized' : err.message;

			return next(createError.Unauthorized(message));
		}

		// Find user and attach to the req object
		console.log(payload);
		return next();
	});
};

module.exports = auth;
