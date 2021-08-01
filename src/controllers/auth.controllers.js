const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');

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
				Data: {
					message: 'Error: Validation Errors.',
					validationErrors,
				},
			});
		} else {
			// Check username and email uniqueness
			const emailCheck = await User.findOne({ 'email.value': email });
			if (emailCheck) {
				const error = new Error('Email already exists.');
				error.statusCode = 400;
				next(error);
			}

			const usernameCheck = await User.findOne({ username });
			if (usernameCheck) {
				const error = new Error('Username is in use.');
				error.statusCode = 400;
				next(error);
			}
		}

		const newUser = new User({
			username,
			age,
			'email.value': email,
			password,
		});

		const { accessToken, refreshToken } = await newUser.generateTokenPair();

		return res.status(201).json({
			success: true,
			Data: {
				username,
				email,
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

		const { accessToken, refreshToken } = await user.generateTokenPair();

		const { _id, username, email, phoneNumber, subscription } = user;
		res.status(200).json({
			_id,
			username,
			email,
			phoneNumber,
			subscription,
			accessToken,
			refreshToken,
		});
	} catch (error) {
		next(error);
	}
};

const postRefresh = (req, res, next) => {
	try {
		const refreshTokenHeader = req.header('X-Refresh-Token');
		const refreshToken = refreshTokenHeader.split(' ')[1];

		jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET,
			async (err, decoded) => {
				if (err) {
					const error = new Error(err.message);
					if (err.name === 'JsonWebTokenError') {
						error.statusCode = 401; // Unauthorized
					} else if (err.name === 'TokenExpiredError') {
						// Refresh token expired, need to log in again
						error.statusCode = 400; // Bad request
					}

					next(error);
				}

				const oldAccessToken = decoded.accessToken;

				jwt.verify(
					oldAccessToken,
					process.env.JWT_ACCESS_SECRET,
					{ ignoreExpiration: true },
					async (err, decoded) => {
						if (err) {
							// Token malformed
							const error = new Error(err.message);
							error.statusCode = 401; // Unauthorized
							next(error);
						}

						const user = await User.findOne({
							_id: decoded._id,
							accessTokens: {
								$in: [oldAccessToken],
							},
							refreshTokens: {
								$in: [refreshToken],
							},
						});

						if (!user) {
							// Make sure tokens belongs to the user
							const error = new Error('User not found.');
							error.statusCode = 400; // Bad request
							next(error);
						}

						// Remove old tokens and generate new ones
						user.refreshTokens = user.refreshTokens.filter(
							(t) => t !== refreshToken
						);

						user.accessTokens = user.accessTokens.filter(
							(t) => t !== oldAccessToken
						);

						const {
							accessToken: newAccessToken,
							refreshToken: newRefreshToken,
						} = await user.generateTokenPair();

						await user.save();

						return res.json({
							success: true,
							Data: {
								accessToken: newAccessToken,
								refreshToken: newRefreshToken,
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
const postLogout = async (req, res, next) => {
	try {
		const user = req.user;
		const accessToken = req.accessToken; // Access token

		const refreshTokenHeader = req.header('X-Refresh-Token');
		const refreshToken = refreshTokenHeader.split(' ')[1];

		// Remove tokens
		user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
		user.accessTokens = user.accessTokens.filter((t) => t !== accessToken);

		await user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Logged out.',
			},
		});
	} catch (error) {
		next(error);
	}
};
const postLogoutAll = async (req, res, next) => {
	try {
		const user = req.user;

		// Remove tokens
		user.refreshTokens = [];
		user.accessTokens = [];

		await user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Logged out from all sessions.',
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
};
