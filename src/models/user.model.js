const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			lowercase: true,
			minlength: 2,
			maxlength: 16,
		},
		age: {
			type: Number,
			default: 0,
		},
		email: {
			value: {
				type: String,
				required: true,
				trim: true,
				unique: true,
				lowercase: true,
			},
			verified: {
				type: Boolean,
				required: true,
				default: false,
			},
		},
		phoneNumber: {
			value: {
				type: String,
				required: false,
				trim: true,
				unique: true,
			},
			verified: {
				type: Boolean,
				required: false,
				default: false,
			},
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minlength: 6,
		},
		avatar: {
			type: Buffer,
			default: undefined,
		},
		subscription: {
			status: {
				type: String,
				required: true,
				default: 'none',
				enum: ['active', 'trialing', 'overdue', 'canceled', 'none'],
			},
			endsIn: {
				type: Date,
				required: true,
				default: Date.now(),
			},
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

userSchema.static('findByCredentials', async (username, email, password) => {
	let user;
	try {
		if (username) {
			user = await User.findOne({ username }).exec();
		} else if (email) {
			user = await User.findOne({ 'email.value': email }).exec();
		}

		if (!user) {
			const error = new Error('User not found.');
			error.statusCode = 400;
			throw error;
		}

		const passCheck = await bcrypt.compare(password, user.password);

		if (!passCheck) {
			const error = new Error('Invalid credentials.');
			error.statusCode = 403;
			throw error;
		}

		return user;
	} catch (error) {
		throw new Error(error);
	}
});

userSchema.method('generateTokenPair', async function () {
	try {
		const user = this;

		const accessToken = jwt.sign(
			{ _id: user._id, email: user.email.value },
			process.env.JWT_ACCESS_SECRET,
			{ expiresIn: '1m' }
		);

		const refreshToken = jwt.sign(
			{ accessToken },
			process.env.JWT_REFRESH_SECRET,
			{ expiresIn: '90 days' }
		);

		return { accessToken, refreshToken };
	} catch (error) {
		throw new Error(error);
	}
});

userSchema.pre('save', async function (next) {
	try {
		const user = this;
		if (user.isModified('password')) {
			user.password = await bcrypt.hash(user.password, 12);
		}
		next();
	} catch (error) {
		throw new Error(error);
	}
});

userSchema.pre('remove', async function (next) {
	try {
	} catch (error) {
		throw new Error(error);
	}
	const user = this;
	// Remove playlists
	next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
