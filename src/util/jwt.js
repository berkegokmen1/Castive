const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const client = require('../db/redis.db');
const { NotExtended } = require('http-errors');

/*
	random number for storing refresh tokens,
	see signRefreshToken method for usage

	allow more than 1 refresh token to be stored per user and have expiry time
	also unique keys
*/
let rn = parseInt(Math.floor(Math.random() * 1000) + 1);
console.log(rn);

const signAccessToken = (userId) => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			{},
			process.env.JWT_ACCESS_SECRET,
			{
				expiresIn: process.env.JWT_ACCESS_EXPIRATION,
				issuer: 'castive.me',
				audience: userId,
			},
			(err, token) => {
				if (err) {
					console.log(err.message);
					return reject(createError.InternalServerError());
				}
				return resolve(token);
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
				issuer: 'castive.me',
				audience: userId,
			},
			(err, token) => {
				if (err) {
					console.log(err.message);
					return reject(createError.InternalServerError());
				}

				// Increment rn, just to get a random number per user
				rn += 1;
				client.set(
					`${userId}:${rn}`,
					token,
					'EX' /* expiration */,
					365 * 24 * 60 * 60 /* seconds */,
					(err, reply) => {
						if (err) {
							console.log(err.message);
							return reject(createError.InternalServerError());
						}

						return resolve(token);
					}
				);
			}
		);
	});
};

const verifyRefreshToken = (refreshToken) => {
	return new Promise((resolve, reject) => {
		jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, payload) => {
			if (err) {
				return reject(createError.Unauthorized());
			}

			const userId = payload.aud; // audience

			client.SCAN(['0', 'MATCH', `${userId}:*`], async (err, [_, keys]) => {
				if (err) {
					return reject(createError.InternalServerError());
				}

				keys.forEach(async (key) => {
					const val = await getValueAsync(key);
					if (val == refreshToken) {
						client.DEL(key, (err, reply) => {
							if (err) {
								return reject(createError.InternalServerError());
							}
							return resolve(userId);
						});
					}
				});

				// Check if this code runs without errors
				return reject(createError.Unauthorized('No token found.'));
			});
		});
	});
};

const getValueAsync = async (key) => {
	return new Promise((resolve, reject) => {
		client.GET(key, (err, reply) => {
			if (err) {
				reject(err);
			}
			resolve(reply);
		});
	});
};

module.exports = {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
};
