const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} = require('../util/jwt');
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

		const accessToken = await signAccessToken(newUser.id);
		const refreshToken = await signRefreshToken(newUser.id);

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

		const accessToken = await signAccessToken(newUser.id);
		const refreshToken = await signRefreshToken(newUser.id);

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

const postRefresh = async (req, res, next) => {
	try {
		const _refreshToken = req.header('X-Refresh-Token');
		if (!_refreshToken) {
			throw createError.BadRequest();
		}

		const userId = await verifyRefreshToken(_refreshToken);

		const accessToken = await signAccessToken(userId);
		const refreshToken = await signRefreshToken(userId);

		return res.json({ accessToken, refreshToken });
	} catch (error) {
		next(error);
	}
};

const postLogout = async (req, res, next) => {
	try {
		const _refreshToken = req.header('X-Refresh-Token');
		if (!_refreshToken) {
			throw createError.BadRequest();
		}

		// Verify refresh token also removes the token from db.
		await verifyRefreshToken(_refreshToken);

		// Means everythign went fine, no response body required.
		return res.sendStatus(204);
	} catch (error) {
		next(error);
	}
};

const postLogoutAll = async (req, res, next) => {
	try {
		// Remove all keys with matching pattern userId => req.user.id
		client.SCAN(['0', 'MATCH', `${req.user.id}:*`], async (err, [_, keys]) => {
			if (err) {
				return reject(createError.InternalServerError());
			}

			client.DEL(keys, (err, reply) => {
				if (err) {
					return reject(createError.InternalServerError());
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
