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
		items: [
			{
				type: String,
				default: [],
				trim: true,
			},
		],
	},
	{
		timestamps: true,
		versionKey: false,
		id: false,
	}
);

const List = mongoose.model('List', listSchema);

module.exports = List;
