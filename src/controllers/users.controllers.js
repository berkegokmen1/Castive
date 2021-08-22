const User = require('../models/user.model');
const sharp = require('sharp');
const createError = require('http-errors');

const checkQuery = require('../util/checkQuery');
const client = require('../db/redis.db');
const {
	checkGenreIdsCache,
	checkGenreIdsFormat,
} = require('../util/checkGenreIds');

const getMe = async (req, res, next) => {
	try {
		const user = req.user;

		let result = user;

		if (checkQuery(req.query.all)) {
			result = await user
				.populate('following', 'username -_id')
				.populate('blocked', 'username -_id')
				.populate('lists', 'title createdAt')
				.populate('library', '_id title')
				.populate('followers', 'username -_id -following')
				.populate('numFollowers')
				.execPopulate();
		} else {
			result = await user.populate('numFollowers').execPopulate();

			if (checkQuery(req.query.following)) {
				result = await result
					.populate('following', 'username -_id')
					.execPopulate();
			}

			if (checkQuery(req.query.followers)) {
				result = await result
					.populate('followers', 'username -_id -following')
					.execPopulate();
			}

			if (checkQuery(req.query.lists)) {
				result = await result
					.populate('lists', 'title createdAt')
					.execPopulate();
			}

			if (checkQuery(req.query.blocked)) {
				result = await result
					.populate('blocked', 'username -_id')
					.execPopulate();
			}

			if (checkQuery(req.query.library)) {
				result = await result.populate('library', '_id title').execPopulate();
			}
		}

		return res.json({
			success: true,
			Data: result,
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
		return res.send(req.user.avatar);
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

const getMeInterests = async (req, res, next) => {
	try {
		return res.json({
			success: true,
			Data: req.user.interests,
		});
	} catch (error) {
		next(error);
	}
};

const postMeInterests = async (req, res, next) => {
	// /me/inserests/:type/:incexc
	try {
		const { type, incexc } = req.params;
		const { ids } = req.body;

		if (!type || !incexc) {
			return next(
				createError.BadRequest('Please provide both type and include/exclude.')
			);
		}

		if (type.toLowerCase() !== 'tv' && type.toLowerCase() !== 'movie') {
			return next(createError.BadRequest("Type must be 'tv' or 'movie'"));
		}

		if (
			incexc.toLowerCase() !== 'include' &&
			incexc.toLowerCase() !== 'exclude'
		) {
			return next(
				createError.BadRequest("Last param must be 'include' or 'exclude'")
			);
		}

		if (!ids) {
			return next(createError.BadRequest('Please provide ids.'));
		}

		if (!checkGenreIdsFormat(ids)) {
			return next(
				createError.BadRequest('ids should be an array of integers.')
			);
		}

		if (!(await checkGenreIdsCache(ids, type))) {
			return next(
				createError.BadRequest('ids should be valid according to tmdb.')
			);
		}

		const temp = req.user.interests[type][incexc];

		// Concat two arrays without duplicates
		for (var i = 0; i < ids.length; i++) {
			if (temp.indexOf(ids[i]) === -1) {
				temp.push(ids[i]);
			}
		}

		req.user.interests[type][incexc] = temp;

		await req.user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Ids have been added.',
			},
		});
	} catch (error) {
		next(error);
	}
};

const deleteMeInterests = async (req, res, next) => {
	// /me/inserests/:type/:incexc
	try {
		const { type, incexc } = req.params;
		const { ids } = req.body;

		if (!type || !incexc) {
			return next(
				createError.BadRequest('Please provide both type and include/exclude.')
			);
		}

		if (type.toLowerCase() !== 'tv' && type.toLowerCase() !== 'movie') {
			return next(createError.BadRequest("Type must be 'tv' or 'movie'"));
		}

		if (
			incexc.toLowerCase() !== 'include' &&
			incexc.toLowerCase() !== 'exclude'
		) {
			return next(
				createError.BadRequest("Last param must be 'include' or 'exclude'")
			);
		}

		if (!ids) {
			return next(createError.BadRequest('Please provide ids.'));
		}

		const temp = req.user.interests[type][incexc];

		req.user.interests[type][incexc] = temp.filter((id) => !ids.includes(id));

		await req.user.save();

		return res.json({
			success: true,
			Data: {
				message: 'Ids have been removed.',
			},
		});
	} catch (error) {
		next(error);
	}
};

// Has some work to do
const patchMe = async (req, res, next) => {};

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

		let user;

		user = await User.findOne({ username })
			.select('username subscription.status blocked following numFollowing')
			.populate('numFollowers')
			.exec();

		if (!user) {
			return next(createError.NotFound('User not found.'));
		}

		if (user.blocked.indexOf(req.user._id) > -1) {
			return next(createError.Forbidden());
		}

		if (checkQuery(req.query.all)) {
			user = await user
				.populate('following', 'username -_id')
				.populate('lists', 'title createdAt')
				.populate('followers', 'username -_id')
				.populate('numFollowers')
				.populate('library', '_id title')
				.execPopulate();
		} else {
			if (checkQuery(req.query.following)) {
				user = await user.populate('following', 'username -_id').execPopulate();
			}

			if (checkQuery(req.query.followers)) {
				user = await user
					.populate('followers', 'username -_id -following')
					.execPopulate();
			}

			if (checkQuery(req.query.lists)) {
				user = await user
					.populate({
						path: 'lists',
						match: { private: false },
						select: 'title createdAt',
					})
					.execPopulate();
			}
		}

		const { blocked, ...rest } = user.toJSON();

		return res.json({
			success: true,
			Data: rest,
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
	getMeInterests,
	postMeInterests,
	deleteMeInterests,
	patchMe,
	deleteMe,
	getUserUsername,
	getUserUsernameAvatar,
	postFollow,
	postUnfollow,
	postBlock,
	postUnblock,
};
