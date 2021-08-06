const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const User = require('../models/user.model');
const client = require('../db/redis.db');

const auth = async (req, res, next) => {
	const accessTokenHeader = req.header('Authorization');
	const accessToken = accessTokenHeader.split(' ')[1]; // Access token

	jwt.verify(
		accessToken,
		process.env.JWT_ACCESS_SECRET,
		async (err, payload) => {
			if (err) {
				const message =
					err.name === 'JsonWebTokenError' ? 'Unauthroized' : err.message;

				return next(createError.Unauthorized(message));
			}

			// Find user and attach to the req object
			const user = await User.findById(payload.aud /* userId */).exec();

			if (!user) {
				return next(createError.Unauthorized());
			}

			client.GET(`AT:${accessToken}:${user.id}`, (err, reply) => {
				if (err) {
					return next(createError.InternalServerError());
				}

				// Check if the token is valid, ie. in the db
				if (!reply) {
					return next(createError.Unauthorized());
				}
				// Attach user to the request
				req.user = user;
				return next();
			});
		}
	);
};

module.exports = auth;
