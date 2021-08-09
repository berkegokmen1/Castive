const path = require('path');

const getVerifyEmail = (req, res, next) => {
	res.set(
		'Content-Security-Policy',
		"default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
	);
	res.sendFile(path.join(__dirname, 'views', 'temp.verifyemail.html'));
};

const getResetPassword = (req, res, next) => {
	res.set(
		'Content-Security-Policy',
		"default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
	);
	res.sendFile(path.join(__dirname, 'views', 'temp.resetpassword.html'));
};

module.exports = { getVerifyEmail, getResetPassword };
