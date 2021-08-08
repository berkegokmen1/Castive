const nodemailer = require('nodemailer');
const url = require('url');

const { signEmailToken, signResetToken } = require('./jwt');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.MAILER_USER,
		pass: process.env.MAILER_PASS,
	},
	logger: process.env.NODE_ENV === 'dev',
});

const sendVerificationMail = async (email) => {
	// Generate confirmation token
	const emailToken = await signEmailToken(email);

	// Generate link from current url
	const link = process.env.BASE_URL + '/auth/verify/' + emailToken;

	transporter.sendMail({
		from: 'no-reply@castive.me',
		to: email,
		subject: 'Please confirm your email adress',
		html: `
			<h1>Click the link below</h1>
			<a href="${link}">${link}</a>
			<p>After 24 hours, the link will be expired.</p>
			`,
		text: '',
	});
};

const sendResetMail = async (email) => {
	const forgotPasswordToken = await signResetToken(email);

	// Generate link from current url
	const link = process.env.BASE_URL + '/auth/reset/' + forgotPasswordToken;

	transporter.sendMail({
		from: 'no-reply@castive.me',
		to: email,
		subject: 'Password reset request',
		html: `
		
			<h1>Click the link below</h1>
			<a href="${link}">${link}</a>
			<p>After 15 minutes, the link will be expired.</p>

			<p>Simply ignore this email if you did not request it.</p>
			`,
		text: '',
	});
};

const sendWelcomeMail = (email, username) => {
	transporter.sendMail({
		from: 'no-reply@castive.me',
		to: email,
		subject: 'Welcome to Castive!',
		html: `
			<h1>Welcome to Castive!</h1>
			<p>Start building your playlists and sharing!</p>
			`,
		text: '',
	});
};

module.exports = { sendVerificationMail, sendResetMail, sendWelcomeMail };
