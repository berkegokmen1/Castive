const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');

const List = require('./list.model');

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			minlength: 2,
			maxlength: 16,
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
		birthdate: {
			type: Date,
			required: true,
		},
		avatar: {
			type: Buffer,
			default: undefined,
		},
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
				default: [],
				required: true,
			},
		],
		blocked: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
				default: [],
				required: true,
			},
		],
		library: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'List',
				default: [],
				required: true,
			},
		],
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
		timestamps: {
			createdAt: true,
			updatedAt: false,
		},
		versionKey: false,
		id: false,
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
	}
);

/******************************
 * PROPERTY METHODS
 ******************************/

userSchema.virtual('age').get(function () {
	return Math.floor(
		(Date.now() - this.birthdate.getTime()) / (1000 * 3600 * 24 * 365)
	);
});

/******************************
 * FOLLOWER METHODS
 ******************************/

userSchema.virtual('followers', {
	ref: 'User',
	localField: '_id',
	foreignField: 'following',
	options: {
		sort: {
			createdAt: -1,
		},
	},
});

userSchema.virtual('numFollowers', {
	ref: 'User',
	localField: '_id',
	foreignField: 'following',
	count: true,
});

userSchema.virtual('numFollowing').get(function () {
	if (this.following) {
		return this.following.length;
	}
});

/******************************
 * LIST METHODS
 ******************************/

userSchema.virtual('lists', {
	ref: 'List',
	localField: '_id',
	foreignField: 'owner',
	options: {
		sort: {
			createdAt: -1,
		},
	},
});

userSchema.method(
	'addList',
	async function (title, description, private, items) {
		const user = this;

		try {
			const list = new List({
				title,
				owner: user._id,
				description: description || '',
				private: private || false,
				items: items || [],
			});

			await list.save();

			return list;
		} catch (error) {
			throw error;
		}
	}
);

/******************************
 * SCHEMA METHODS
 ******************************/

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
		} else {
			const passCheck = await bcrypt.compare(password, user.password);

			if (!passCheck) {
				throw createError.BadRequest('Invalid credentials.');
			}

			return user;
		}
	} catch (error) {
		throw error;
	}
});

/******************************
 * SCHEMA MIDDLEWARES
 ******************************/

userSchema.pre('save', async function (next) {
	try {
		const user = this;
		if (user.isModified('password')) {
			user.password = await bcrypt.hash(user.password, 12);
		}
		next();
	} catch (error) {
		throw createError.InternalServerError();
	}
});

userSchema.pre('remove', async function (next) {
	try {
		const user = this;

		await List.deleteMany({ owner: user._id }).exec();

		next();
	} catch (error) {
		throw error;
	}
});

const User = mongoose.model('User', userSchema);

module.exports = User;
