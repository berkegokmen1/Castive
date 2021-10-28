/*  
  Castive, A platform to build and share movies & tv series playlists
  Copyright (C) 2021  Ahmet Berke Gökmen

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const nodemailer = require('nodemailer');

const { signEmailToken, signResetToken } = require('./jwt');

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
  logger: false,
});

const sendVerificationMail = async (email) => {
  // Generate confirmation token
  const emailToken = await signEmailToken(email);

  // Generate link from current url
  const link = process.env.BASE_URL + '/v1/auth/verify/' + emailToken;

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
  const link = process.env.BASE_URL + '/v1/auth/reset/' + forgotPasswordToken;

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
    subject: `Welcome to Castive ${username}!`,
    html: `
			<h1>Welcome to Castive ${username}!</h1>
			<p>Start building your playlists and sharing!</p>
			`,
    text: '',
  });
};

module.exports = { sendVerificationMail, sendResetMail, sendWelcomeMail };
