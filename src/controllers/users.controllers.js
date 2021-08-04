const User = require('../models/user.model');
const sharp = require('sharp');
const { updateProfileValidation } = require('../util/formValidation');

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
			const error = new Error('No avatar is present.');
			error.statusCode = 404;
			return next(error);
		}

		res.set('Content-Type', 'image/png');
		res.send(req.user.avatar);
	} catch (error) {
		return next(error);
	}
};

const putMeAvatar = async (req, res, next) => {
	try {
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
		res.json({
			success: true,
			Data: {
				message: 'Avatar removed.',
			},
		});
	} catch (error) {
		return next(error);
	}
};
const patchMe = async (req, res, next) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['email', 'age', 'phoneNumber'];
	const isValid = updates.every((update) => allowedUpdates.includes(update));
	if (!isValid) {
		const error = new Error('Invalid operation(s).');
		error.statusCode = 400;
		return next(error);
	}

	const { email, age, phoneNumber } = req.body;

	const validationErrors = updateProfileValidation(email, age, phoneNumber);

	if (validationErrors.length > 0) {
		return res.status(400).json({
			success: false,
			Data: {
				message: 'Error: Validation Errors.',
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
			const error = new Error('Email already exists.');
			error.statusCode = 400;
			next(error);
		}
	} catch (error) {
		return next(error);
	}

	try {
		if (email) {
			req.user.email.value = email;
		}
		if (age) {
			req.user.age = age;
		}
		if (phoneNumber) {
			req.user.phoneNumber.value = phoneNumber;
		}

		await req.user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Updated profile.',
				updatedFields: {
					email,
					age,
					phoneNumber,
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
		return res.json({
			success: true,
			Data: {
				message: 'User removed.',
			},
		});
	} catch (error) {
		next(error);
	}
};
const getUserId = async (req, res, next) => {
	const userId = req.params.userId;
	if (!userId) {
		const error = new Error('No Id specified.');
		error.statusCode = 400;
		return next(error);
	}

	try {
		const user = await User.findById(userId).lean().exec();

		if (!user) {
			const error = new Error('User not found.');
			error.statusCode = 404;
			return next(error);
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
const getUserIdAvatar = async (req, res, next) => {
	const userId = req.params.userId;
	if (!userId) {
		const error = new Error('No Id specified.');
		error.statusCode = 400;
		return next(error);
	}

	try {
		const user = await User.findById(userId).lean().exec();

		if (!user) {
			const error = new Error('User not found.');
			error.statusCode = 404;
			return next(error);
		}

		if (!user.avatar) {
			const error = new Error('No avatar is present.');
			error.statusCode = 404;
			return next(error);
		}

		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
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
	getUserId,
	getUserIdAvatar,
};