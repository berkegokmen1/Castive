const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { signAccessToken, signRefreshToken } = require('../util/jwt');
const User = require('../models/user.model');

const {
	registerValidation,
	resetPasswordValidation,
} = require('../util/formValidation');
const client = require('../db/redis.db');
const {
	sendVerificationMail,
	sendResetMail,
	sendWelcomeMail,
} = require('../util/mailer');

const putRegister = async (req, res, next) => {
	try {
		const { username, age, email, password } = req.body;
		const validationErrors = registerValidation(username, age, email, password);

		if (validationErrors.length > 0) {
			return res.status(400).json({
				success: false,
				Data: {
					error: 'Validation Errors',
					validationErrors,
				},
			});
		} else {
			// Check username and email uniqueness
			const emailCheck = await User.findOne({ 'email.value': email })
				.lean()
				.exec();
			if (emailCheck) {
				throw createError.Conflict('Email already exists.');
			}

			const usernameCheck = await User.findOne({ username }).lean().exec();
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

		await newUser.save();

		// Send async confirmation mail
		sendVerificationMail(email);

		// Send async welcome mail
		sendWelcomeMail(email, username);

		const [accessToken, refreshToken] = await Promise.all([
			signAccessToken(userId),
			signRefreshToken(userId),
		]);

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
		const email = user.email.value;

		// Send async confirmation mail if the account is not verified
		if (!user.email.verified) {
			sendVerificationMail(email);
		}

		const [accessToken, refreshToken] = await Promise.all([
			signAccessToken(userId),
			signRefreshToken(userId),
		]);

		return res.json({
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

					// Check refresh token
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
												const [accessToken, refreshToken] = await Promise.all([
													signAccessToken(userId),
													signRefreshToken(userId),
												]);

												return res.json({
													success: true,
													Data: {
														accessToken,
														refreshToken,
													},
												});
											}
										);
									} else {
										// Token not found in db
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

				if (req.user._id.toString() !== userId) {
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

						return res.json({
							success: true,
							Data: {
								message: 'Logged out.',
							},
						});
					}
				);
			}
		);
	} catch (error) {
		next(error);
	}
};

const postLogoutAll = async (req, res, next) => {
	try {
		client.KEYS(`*:*:${req.user._id.toString()}`, (err, reply) => {
			if (err) {
				return next(createError.InternalServerError());
			}
			client.DEL(reply, (err, reply) => {
				if (err) {
					return next(createError.InternalServerError());
				}

				return res.json({
					success: true,
					Data: {
						message: 'Logged out from all sessions.',
					},
				});
			});
		});
	} catch (error) {
		next(error);
	}
};

const patchVerifyEmail = async (req, res, next) => {
	try {
		if (!req.body.token) {
			return next(createError.BadRequest('Verification token is required.'));
		}

		const emailToken = req.body.token;

		jwt.verify(
			emailToken,
			process.env.JWT_EMAIL_SECRET,
			async (err, payload) => {
				if (err) {
					return next(createError.Unauthorized());
				}

				const email = payload.aud;

				const user = await User.findOne({ 'email.value': email }).exec();

				if (!user) {
					// Made request for a random email
					return next(createError.BadRequest('User not found.'));
				}

				if (!user.email.verified) {
					// Email is not verified
					user.email.verified = true;

					await user.save();

					return res.json({
						success: true,
						Data: {
							message: `Email (${email}) has successfully been verified.`,
						},
					});
				} else {
					// Email has already been verified
					return next(
						createError.BadRequest('Email has already been verified.')
					);
				}
			}
		);
	} catch (error) {
		next(error);
	}
};

const postRequestVerificationMail = async (req, res, next) => {
	try {
		const email = req.body.email;

		if (!email) {
			return next(createError.BadRequest('Email is required'));
		}

		const user = await User.findOne({ 'email.value': email }).lean().exec();

		if (!user) {
			return next(createError.BadRequest('Email is not registered.'));
		}

		if (user.email.verified) {
			return next(createError.BadRequest('Email has already been verified.'));
		}

		sendVerificationMail(email);

		return res.json({
			success: true,
			Data: {
				message: 'New verification mail has been sent.',
			},
		});
	} catch (error) {
		next(error);
	}
};

const patchReset = async (req, res, next) => {
	try {
		const { token, password } = req.body;

		if (!token || !password) {
			return next(
				createError.BadRequest('Token and new password is required.')
			);
		}

		const validationErrors = resetPasswordValidation(password);

		if (validationErrors.length > 0) {
			return res.status(400).json({
				success: false,
				Data: {
					error: 'Validation Errors',
					validationErrors,
				},
			});
		}

		// Check if the token is in the redis db, ie. not used before
		client.GET(`RESET:${token}`, (err, reply) => {
			if (err) {
				return next(createError.InternalServerError());
			}

			if (!reply) {
				return next(createError.Unauthorized());
			}

			// We have the token in the db
			// Verify the token
			// Update the password
			// Remove the token from db
			jwt.verify(
				token,
				process.env.JWT_RESET_PASSWORD_SECRET,
				async (err, payload) => {
					if (err) {
						return next(createError.Unauthorized());
					}

					const email = payload.aud;

					const user = await User.findOne({ 'email.value': email }).exec();

					if (!user) {
						return next(createError.BadRequest('User not found.'));
					}

					// Check if the previous password is the same as the new one
					const isPassTheSame = await bcrypt.compare(password, user.password);

					if (isPassTheSame) {
						return next(
							createError.BadRequest(
								'New password cannot be same as the old one.'
							)
						);
					}

					// Update the password of the user and make the email verified since it has been used by the user
					user.password = password;
					user.email.verified = true;
					await user.save();

					// Remove the reset token from redis to prevent subsequent use
					client.DEL(`RESET:${token}`, async (err, reply) => {
						if (err) {
							return next(createError.InternalServerError());
						}

						// Remove all access and refresh tokens of the user
						client.KEYS(`*:*:${user._id.toString()}`, (err, reply) => {
							if (err) {
								return next(createError.InternalServerError());
							}
							client.DEL(reply, (err, reply) => {
								if (err) {
									return next(createError.InternalServerError());
								}

								return res.json({
									success: true,
									Data: {
										message: 'Password updated',
									},
								});
							});
						});
					});
				}
			);
		});
	} catch (error) {
		next(error);
	}
};

const postRequestResetMail = async (req, res, next) => {
	try {
		const email = req.body.email;

		if (!email) {
			return next(createError.BadRequest('Email is required'));
		}

		const user = await User.findOne({ 'email.value': email }).lean().exec();

		if (!user) {
			return next(createError.BadRequest('Email is not registered.'));
		}

		sendResetMail(email);

		return res.json({
			success: true,
			Data: {
				message: 'Password reset mail has been sent.',
			},
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
	patchVerifyEmail,
	postRequestVerificationMail,
	patchReset,
	postRequestResetMail,
};
