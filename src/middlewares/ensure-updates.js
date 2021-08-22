const User = require('../models/user.model');

const ensure = async () => {
	// console.log('sa');
	// await User.updateMany(
	// 	{ birthdate: { $exists: false } },
	// 	{
	// 		$set: {
	// 			birthdate: new Date('1980-03-22'),
	// 		},
	// 	}
	// );
};

module.exports = ensure;
