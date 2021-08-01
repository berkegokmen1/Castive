const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
	try {
		let user;

		const accessTokenHeader = req.header('Authorization');
		const accessToken = accessTokenHeader.split(' ')[1]; // Access token

		jwt.verify(
			accessToken,
			process.env.JWT_ACCESS_SECRET,
			async (err, decoded) => {
				if (err) {
					const error = new Error(err.message);
					if (err.name === 'JsonWebTokenError') {
						error.statusCode = 401; // Unauthorized
					} else if (err.name === 'TokenExpiredError') {
						error.statusCode = 400; // Bad request
					}

					return next(error);
				}

				user = await User.findOne({
					_id: decoded._id,
					accessTokens: {
						$in: [accessToken],
					},
				}).exec();

				if (!user) {
					const error = new Error('Not authenticated.');
					error.statusCode = 401; // Unauthorized
					return next(error);
				}

				req.user = user;
				req.accessToken = accessToken;

				return next();
			}
		);
	} catch (error) {
		next(error);
	}
};

module.exports = auth;
