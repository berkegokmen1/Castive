const nodemailer = require('nodemailer');
const url = require('url');

const { signEmailToken } = require('./jwt');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.MAILER_USER,
		pass: process.env.MAILER_PASS,
	},
	logger: process.env.NODE_ENV === 'dev',
});

const sendVerificationMail = async (req, email) => {
	// Generate confirmation token
	const emailToken = await signEmailToken(email);

	// Generate link from current url
	const link =
		url.format({
			protocol: req.protocol,
			host: req.get('host'),
		}) +
		'/auth/verify/' +
		emailToken;

	transporter.sendMail({
		from: 'no-reply@castive.me',
		to: email,
		subject: 'Please confirm your email adress',
		html: `
			<h1>Click the link below</h1>
			<a href="${link}">${link}</a>
			<p>After 24 hours, the link will be expired</p>
			`,
	});
};

module.exports = { sendVerificationMail };
