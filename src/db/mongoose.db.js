const mongoose = require('mongoose');

const connectMongoose = () => {
	return new Promise((resolve, reject) => {
		mongoose
			.connect(process.env.MONGODB_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useFindAndModify: false,
				useCreateIndex: true,
			})
			.then((result) => {
				console.log('Mongoose connected.');
				resolve(result);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

module.exports = connectMongoose;
