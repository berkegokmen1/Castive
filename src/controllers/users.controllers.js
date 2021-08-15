const User = require('../models/user.model');
const sharp = require('sharp');
const createError = require('http-errors');

const { updateProfileValidation } = require('../util/formValidation');
const client = require('../db/redis.db');
const { sendVerificationMail } = require('../util/mailer');

const getMe = async (req, res, next) => {
	try {
		const user = req.user;

		const result = await user
			.populate('following', 'username -_id')
			.populate('blocked', 'username -_id')
			.populate('lists', 'title createdAt')
			.populate('followers', 'username -_id -following')
			.populate('numFollowers')
			.execPopulate();

		return res.json({
			success: true,
			Data: {
				user: result,
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
	if (!req.params.username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const username = req.params.username;
		const user = await User.findOne({ username })
			.select('username subscription.status blocked') // Add desired fields
			.populate('following', 'username -_id')
			.populate('lists', 'title createdAt')
			.populate('followers', 'username -_id')
			.populate('numFollowers')
			.exec();

		if (!user) {
			return next(createError.NotFound('User not found.'));
		}

		if (user.blocked.indexOf(req.user._id) > -1) {
			return next(createError.Forbidden('Blocked.'));
		}

		return res.json({
			success: true,
			Data: {
				user,
			},
		});
	} catch (error) {
		next(error);
	}
};
const getUserUsernameAvatar = async (req, res, next) => {
	if (!req.params.username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const username = req.params.username;
		const user = await User.findOne({ username })
			.select('avatar blocked')
			.exec(); // .lean() => does not work with binary for some reason

		if (!user) {
			return next(createError.NotFound('User not found.'));
		}

		if (user.blocked.indexOf(req.user._id) > -1) {
			return next(createError.Forbidden('Blocked.'));
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

const postFollow = async (req, res, next) => {
	if (!req.query.username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const user = req.user;
		const username = req.query.username;

		if (user.username === username) {
			return next(createError.BadRequest());
		}

		const userToUse = await User.findOne({ username })
			.select('_id blocked')
			.exec();

		if (!userToUse) {
			return next(createError.NotFound('User not found.'));
		}

		if (userToUse.blocked.indexOf(user._id) !== -1) {
			return next(createError.Forbidden('Blocked.'));
		}

		if (user.following.indexOf(userToUse._id) > -1) {
			return next(createError.BadRequest(`Already following ${username}.`));
		}

		user.following.push(userToUse._id);

		await user.save();

		return res.json({
			success: true,
			Data: {
				message: `Following ${username}.`,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const postUnfollow = async (req, res, next) => {
	if (!req.query.username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const user = req.user;
		const username = req.query.username;

		if (user.username === username) {
			return next(createError.BadRequest());
		}

		const userToUse = await User.findOne({ username })
			.select('_id blocked')
			.exec();

		if (!userToUse) {
			return next(createError.NotFound('User not found.'));
		}

		if (userToUse.blocked.indexOf(user._id) > -1) {
			return next(createError.Forbidden('Blocked.'));
		}

		// Check the userToUse id in the user following list
		const index = user.following.indexOf(userToUse._id);

		if (index === -1) {
			return next(createError.BadRequest(`Already not following ${username}`));
		}

		// Remove userToUse id from user following list
		user.following.splice(index, 1);

		await user.save();

		return res.json({
			success: true,
			Data: {
				message: `Unfollowed ${username}.`,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const postBlock = async (req, res, next) => {
	if (!req.query.username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const user = req.user;
		const username = req.query.username;

		if (user.username === username) {
			return next(createError.BadRequest());
		}

		const userToUse = await User.findOne({ username })
			.select('_id')
			.lean()
			.exec();

		if (!userToUse) {
			return next(createError.NotFound('User not found.'));
		}

		if (user.blocked.indexOf(userToUse._id) !== -1) {
			return next(createError.BadRequest(`${username} is already blocked.`));
		}

		user.blocked.push(userToUse._id);

		await user.save();

		return res.json({
			success: true,
			Data: {
				message: `Blocked ${username}.`,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const postUnblock = async (req, res, next) => {
	if (!req.query.username) {
		return next(createError.BadRequest('No username specified.'));
	}

	try {
		const user = req.user;
		const username = req.query.username;

		if (user.username === username) {
			return next(createError.BadRequest());
		}

		const userToUse = await User.findOne({ username })
			.select('_id')
			.lean()
			.exec();

		if (!userToUse) {
			return next(createError.NotFound('User not found.'));
		}

		const index = user.blocked.indexOf(userToUse._id);

		if (index === -1) {
			return next(createError.BadRequest(`${username} is not blocked.`));
		}

		// Remove userToUse id from user blocked list
		user.blocked.splice(index, 1);

		await user.save();

		return res.json({
			success: true,
			Data: {
				message: `Unblocked ${username}.`,
			},
		});
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
	postFollow,
	postUnfollow,
	postBlock,
	postUnblock,
};
