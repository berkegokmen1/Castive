const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const client = require('../db/redis.db');

/**
 * Store jwt tokens in http-only cookies => does not allow access or modification to token
 * Storing in local storage => X
 */

const signAccessToken = (userId) => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			{},
			process.env.JWT_ACCESS_SECRET,
			{
				expiresIn: process.env.JWT_ACCESS_EXPIRATION,
				issuer: process.env.JWT_ISSUER,
				audience: userId,
			},
			(err, token) => {
				if (err) {
					return reject(createError.InternalServerError());
				}

				client.set(
					`AT:${token}:${userId}`,
					1,
					'EX' /* expiration */,
					5 * 60 /* seconds */,
					(err, reply) => {
						if (err) {
							return reject(createError.InternalServerError());
						}

						return resolve(token);
					}
				);
			}
		);
	});
};

const signRefreshToken = (userId) => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			{},
			process.env.JWT_REFRESH_SECRET,
			{
				expiresIn: process.env.JWT_REFRESH_EXPIRATION,
				issuer: process.env.JWT_ISSUER,
				audience: userId,
			},
			(err, token) => {
				if (err) {
					return reject(createError.InternalServerError());
				}

				client.set(
					`RT:${token}:${userId}`,
					1,
					'EX' /* expiration */,
					365 * 24 * 60 * 60 /* seconds */,
					(err, reply) => {
						if (err) {
							return reject(createError.InternalServerError());
						}

						return resolve(token);
					}
				);
			}
		);
	});
};

const signEmailToken = (email) => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			{},
			process.env.JWT_EMAIL_SECRET,
			{
				issuer: process.env.JWT_ISSUER,
				audience: email,
			},
			(err, token) => {
				if (err) {
					return reject(createError.InternalServerError());
				}

				return resolve(token);
			}
		);
	});
};

const signResetToken = (email) => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			{},
			process.env.JWT_RESET_PASSWORD_SECRET,
			{
				expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRATION,
				issuer: process.env.JWT_ISSUER,
				audience: email,
			},
			(err, token) => {
				if (err) {
					return reject(createError.InternalServerError());
				}

				client.set(
					`RESET:${token}`,
					1,
					'EX' /* expiration */,
					15 * 60 /* seconds */,
					(err, reply) => {
						if (err) {
							return reject(createError.InternalServerError());
						}

						return resolve(token);
					}
				);
			}
		);
	});
};

module.exports = {
	signAccessToken,
	signRefreshToken,
	signEmailToken,
	signResetToken,
};
