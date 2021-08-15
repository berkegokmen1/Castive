const User = require('../models/user.model');
const createError = require('http-errors');

const getMe = async (req, res, next) => {
	try {
		const user = req.user;

		const result = await user
			.populate('lists', '_id title createdAt')
			.execPopulate();

		return res.json({
			success: true,
			Data: {
				lists: result.lists,
			},
		});
	} catch (error) {
		next(error);
	}
};

// Add validation
const postMe = async (req, res, next) => {
	try {
		const { title, private } = req.body;
		const user = req.user;

		if (!title) {
			return next(
				createError.BadRequest('Please provide all the required parameters.')
			);
		}

		const list = await user.addList(title, private);

		return res.status(201).json({
			success: true,
			Data: {
				message: 'List successfully created.',
			},
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getMe,
	postMe,
};
