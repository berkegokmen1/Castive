const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');

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
			user = await User.findOne({ username })
				.select('_id email password')
				.lean()
				.exec();
		} else if (email) {
			user = await User.findOne({ 'email.value': email })
				.select('_id email password')
				.lean()
				.exec();
		}

		if (!user) {
			throw createError.Forbidden('User not found.');
		}

		const passCheck = await bcrypt.compare(password, user.password);

		if (!passCheck) {
			throw createError.BadRequest('Invalid credentials.');
		}

		return user;
	} catch (error) {
		throw error;
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
