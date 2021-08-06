const createError = require('http-errors');
const jwt = require('jsonwebtoken');

const { signAccessToken, signRefreshToken } = require('../util/jwt');
const User = require('../models/user.model');

const { registerValidation } = require('../util/formValidation');
const client = require('../db/redis.db');

const putRegister = async (req, res, next) => {
	try {
		const { username, age, email, password } = req.body;
		const validationErrors = registerValidation(username, age, email, password);

		if (validationErrors.length > 0) {
			return res.status(400).json({
				success: false,
				Data: {
					message: 'Error: Validation Errors.',
					validationErrors,
				},
			});
		} else {
			// Check username and email uniqueness
			const emailCheck = await User.findOne({ 'email.value': email });
			if (emailCheck) {
				throw createError.Conflict('Email already exists.');
			}

			const usernameCheck = await User.findOne({ username });
			if (usernameCheck) {
				throw createError.Conflict('Username already exists.');
			}
		}

		const newUser = new User({
			username,
			age,
			'email.value': email,
			password,
		});

		const userId = newUser._id.toString();

		const accessToken = await signAccessToken(userId);
		const refreshToken = await signRefreshToken(userId);

		await newUser.save();

		return res.status(201).json({
			success: true,
			Data: {
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		next(error);
	}
};

const postLogin = async (req, res, next) => {
	try {
		const {
			username: bUsername,
			email: bEmail,
			password: bPassword,
		} = req.body;
		const user = await User.findByCredentials(bUsername, bEmail, bPassword);

		const userId = user._id.toString();

		const accessToken = await signAccessToken(userId);
		const refreshToken = await signRefreshToken(userId);

		return res.json({ accessToken, refreshToken });
	} catch (error) {
		next(error);
	}
};

const postRefresh = async (req, res, next) => {
	try {
		const accessTokenHeader = req.header('Authorization');
		const _accessToken = accessTokenHeader.split(' ')[1]; // Access token
		const _refreshToken = req.header('X-Refresh-Token');

		if (!_refreshToken || !_accessToken) {
			throw createError.BadRequest();
		}

		jwt.verify(
			_accessToken,
			process.env.JWT_ACCESS_SECRET,
			{ ignoreExpiration: true }, // Access token is likely to have been expired
			(err, payload) => {
				if (err) {
					const message =
						err.name === 'JsonWebTokenError' ? 'Unauthroized' : err.message;

					return next(createError.Unauthorized(message));
				}

				const aTokenUserId = payload.aud;

				// Delete access token from db if it exists
				client.DEL(`AT:${_accessToken}:${aTokenUserId}`, (err, reply) => {
					if (err) {
						return next(createError.InternalServerError());
					}

					jwt.verify(
						_refreshToken,
						process.env.JWT_REFRESH_SECRET,
						(err, payload) => {
							if (err) {
								return reject(createError.Unauthorized());
							}

							const rTokenUserId = payload.aud;

							// Check to see if the user is trying to use another refresh token
							if (aTokenUserId !== rTokenUserId) {
								return next(createError.Unauthorized());
							}

							client.GET(
								`RT:${_refreshToken}:${rTokenUserId}`,
								(err, reply) => {
									if (err) {
										return next(createError.InternalServerError());
									}
									if (reply) {
										// Token exists in redisdb, delete token
										client.DEL(
											`RT:${_refreshToken}:${rTokenUserId}`,
											async (err, reply) => {
												if (err) {
													return next(createError.InternalServerError());
												}

												const userId = rTokenUserId.toString();

												// Generate new tokens
												const accessToken = await signAccessToken(userId);
												const refreshToken = await signRefreshToken(userId);

												return res.json({ accessToken, refreshToken });
											}
										);
									} else {
										// Token not found in db
										console.log('no reply token not found');
										return next(createError.Unauthorized());
									}
								}
							);
						}
					);
				});
			}
		);
	} catch (error) {
		next(error);
	}
};

// User is attached to the req object
const postLogout = async (req, res, next) => {
	try {
		const accessTokenHeader = req.header('Authorization');
		const _accessToken = accessTokenHeader.split(' ')[1];
		const _refreshToken = req.header('X-Refresh-Token');

		if (!_refreshToken) {
			throw createError.BadRequest();
		}

		jwt.verify(
			_refreshToken,
			process.env.JWT_REFRESH_SECRET,
			{ ignoreExpiration: true }, // Request is ok as long as the token is valid
			(err, payload) => {
				if (err) {
					throw createError.Unauthorized();
				}

				const userId = payload.aud; // audience

				if (req.user.id !== userId) {
					// Access token and refresh token have different audiences
					// User might be trying to use another refresh token
					throw createError.Unauthorized();
				}

				client.DEL(
					[`RT:${_refreshToken}:${userId}`, `AT:${_accessToken}:${userId}`],
					(err, reply) => {
						if (err) {
							return reject(createError.InternalServerError());
						}

						return res.sendStatus(204);
					}
				);
			}
		);
	} catch (error) {
		next(error);
	}
};

// has some work to do
const postLogoutAll = async (req, res, next) => {
	let cursor = 0;
	let found = [];

	const scan = (cb) => {
		do {
			client.scan(
				[cursor, 'MATCH', `*:*:${req.user.id}`],
				(newCursor, results) => {
					cursor = newCursor;
					found = found.concat(results);
					scan();
				}
			);
		} while (cursor !== 0);
		cb();
	};

	try {
		scan(() => {
			client.DEL(found, (err, reply) => {
				if (err) {
					return next(createError.InternalServerError());
				}

				return res.sendStatus(204);
			});
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	putRegister,
	postLogin,
	postRefresh,
	postLogout,
	postLogoutAll,
};
