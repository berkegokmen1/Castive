const User = require('../models/user.model');
const sharp = require('sharp');
const createError = require('http-errors');

const { updateProfileValidation } = require('../util/formValidation');
const client = require('../db/redis.db');
const { sendVerificationMail } = require('../util/mailer');

const getMe = (req, res, next) => {
	try {
		const { _id, username, email, phoneNumber, subscription } = req.user;

		return res.json({
			success: true,
			Data: {
				_id,
				username,
				email,
				phoneNumber,
				subscription,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const getMeAvatar = (req, res, next) => {
	try {
		if (!req.user.avatar) {
			return next(createError.NotFound('No avatar found.'));
		}

		res.set('Content-Type', 'image/png');
		res.send(req.user.avatar);
	} catch (error) {
		return next(error);
	}
};

const putMeAvatar = async (req, res, next) => {
	try {
		if (!req.file) {
			return next(createError.BadRequest('No file provided.'));
		}

		const buffer = await sharp(req.file.buffer)
			.resize({ width: 500, height: 500 })
			.png()
			.toBuffer();

		req.user.avatar = buffer;
		await req.user.save();

		return res.status(201).json({
			success: true,
			Data: {
				message: 'Avatar updated.',
			},
		});
	} catch (error) {
		return next(error);
	}
};

const deleteMeAvatar = async (req, res, next) => {
	try {
		req.user.avatar = undefined;
		await req.user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Avatar removed.',
			},
		});
	} catch (error) {
		return next(error);
	}
};

// Has some work to do
const patchMe = async (req, res, next) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['email', 'age'];
	const isValid = updates.every((update) => allowedUpdates.includes(update));
	if (!isValid) {
		return next(createError.BadRequest('Invalid operation(s).'));
	}

	const { email, age } = req.body;

	const validationErrors = updateProfileValidation(email, age);

	if (validationErrors.length > 0) {
		return res.status(400).json({
			success: false,
			Data: {
				error: 'Validation Errors',
				validationErrors,
			},
		});
	}

	try {
		// Check username and email uniqueness
		const emailCheck = await User.findOne({ 'email.value': email })
			.lean()
			.exec();
		if (emailCheck) {
			return next(createError.Conflict('Email already exists.'));
		}
	} catch (error) {
		return next(error);
	}

	try {
		if (email) {
			req.user.email.value = email;
			req.user.email.verified = false;
			sendVerificationMail(email);
		}
		if (age) {
			req.user.age = age;
		}

		await req.user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Updated profile.',
				updatedFields: {
					email,
					age,
				},
			},
		});
	} catch (error) {
		return next(error);
	}
};

const deleteMe = async (req, res, next) => {
	try {
		await req.user.remove();

		// Delete all tokens belonging to the user
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
						message: 'User removed.',
					},
				});
			});
		});
	} catch (error) {
		next(error);
	}
};
const getUserUsername = async (req, res, next) => {
	const username = req.params.username;
	if (!username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const user = await User.findOne({ username })
			.select('subscription') // Add desired fields
			.lean()
			.exec();

		if (!user) {
			return next(createError.NotFound('User not found.'));
		}

		const { username, subscription } = user;

		return res.json({
			success: true,
			Data: {
				username,
				subscription: {
					status: subscription.status,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};
const getUserUsernameAvatar = async (req, res, next) => {
	const username = req.params.username;
	if (!username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const user = await User.findOne({ username }).select('avatar').exec();

		if (!user) {
			return next(createError.NotFound('User not found.'));
		}

		if (!user.avatar) {
			return next(createError.NotFound('No avatar found.'));
		}

		res.set('Content-Type', 'image/png');
		return res.send(user.avatar);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getMe,
	getMeAvatar,
	putMeAvatar,
	deleteMeAvatar,
	patchMe,
	deleteMe,
	getUserUsername,
	getUserUsernameAvatar,
};
