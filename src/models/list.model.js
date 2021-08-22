const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 25,
		},
		cover: {
			type: Buffer,
			default: undefined,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		description: {
			type: String,
			default: '',
			trim: true,
			maxlength: 100,
		},
		private: {
			type: Boolean,
			default: false,
		},
		items: {
			type: [String],
			default: [],
			trim: true,
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
 * FOLLOWER METHODS
 ******************************/

listSchema.virtual('followers', {
	ref: 'User',
	localField: '_id',
	foreignField: 'library',
	options: {
		sort: {
			createdAt: -1,
		},
	},
});

listSchema.virtual('numFollowers', {
	ref: 'User',
	localField: '_id',
	foreignField: 'library',
	count: true,
});

const List = mongoose.model('List', listSchema);

module.exports = List;
