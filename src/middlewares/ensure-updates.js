const User = require('../models/user.model');

const ensure = async () => {
	// console.log('sa');
	// await User.updateMany(
	// 	{ interests: { $exists: false } },
	// 	{
	// 		$set: {
	// 			interests: {
	// 				tv: {
	// 					include: [],
	// 					exclude: [],
	// 				},
	// 				movie: {
	// 					include: [],
	// 					exclude: [],
	// 				},
	// 			},
	// 		},
	// 	}
	// );
};

module.exports = ensure;
