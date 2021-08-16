const validator = require('validator');

const registerValidation = (username, email, password) => {
	// username => no special chars, min 2, max 16, no white space
	// email => valid email
	// password => 1 uppercase, 1 lowercase, min 6, max 25, 1 special char, no white space, no username
	// password, password2 => matching

	const errors = [];

	if (typeof username !== 'string') {
		errors.push('Username must be a string.');
	} else {
		if (username === '') {
			errors.push('Username cannot be empty.');
		} else {
			if (username.length < 2) {
				errors.push('Username must be at least 2 characters long.');
			}

			if (username.length > 16) {
				errors.push('Username cannot be longer than 16 characters.');
			}

			if (/\s/.test(username)) {
				errors.push('Username cannot contain any whitespaces.');
			}

			if (/\W/.test(username)) {
				errors.push('Username cannot contain any special characters.');
			}

			if (!/[a-zA-Z]/.test(username)) {
				errors.push('Username must contain at least one letter.');
			}
		}
	}

	if (typeof password !== 'string') {
		errors.push('Password must be a string.');
	} else {
		if (password === '') {
			errors.push('Password cannot be blank.');
		} else {
			if (password.includes(username)) {
				errors.push('Password cannot contain username.');
			}

			if (password.length < 6) {
				errors.push('Password must be at least 6 characters long.');
			}

			if (password.length > 25) {
				errors.push('Password length must be less than 25 characters long.');
			}

			if (/\s/.test(password)) {
				errors.push('Password cannot contain any whitespaces.');
			}

			if (
				!validator.isStrongPassword(password, {
					minLowercase: 1,
					minUppercase: 1,
					minNumbers: 1,
					minSymbols: 1,
					returnScore: false,
				})
			) {
				errors.push(
					'Password must contain at least 1 uppercase, 1 lowercase, 1 numeric and 1 special character.'
				);
			}
		}
	}

	if (typeof email !== 'string') {
		errors.push('Email must be a string.');
	} else {
		if (!validator.isEmail(email)) {
			errors.push('Email adress is not valid.');
		}
	}

	return errors;
};

const updateProfileValidation = (email) => {
	const errors = [];

	if (email) {
		if (typeof email !== 'string') {
			errors.push('Email must be a string.');
		} else {
			if (!validator.isEmail(email)) {
				errors.push('Email adress is not valid.');
			}
		}
	}

	return errors;
};

const resetPasswordValidation = (password) => {
	const errors = [];

	if (typeof password !== 'string') {
		errors.push('Password must be a string.');
	} else {
		if (password === '') {
			errors.push('Password cannot be blank.');
		} else {
			if (password.length < 6) {
				errors.push('Password must be at least 6 characters long.');
			}

			if (password.length > 25) {
				errors.push('Password length must be less than 25 characters long.');
			}

			if (/\s/.test(password)) {
				errors.push('Password cannot contain any whitespaces.');
			}

			if (
				!validator.isStrongPassword(password, {
					minLowercase: 1,
					minUppercase: 1,
					minNumbers: 1,
					minSymbols: 1,
					returnScore: false,
				})
			) {
				errors.push(
					'Password must contain at least 1 uppercase, 1 lowercase, 1 numeric and 1 special character.'
				);
			}
		}
	}

	return errors;
};

const listValidation = (title, description, private) => {
	const errors = [];

	if (title || title === '') {
		if (typeof title !== 'string') {
			errors.push('Title must be a string.');
		} else {
			if (title.length < 1) {
				errors.push('Title length must be in between 1 and 25.');
			}
			if (title.length > 25) {
				errors.push('Title length must be in between 1 and 25.');
			}
		}
	}

	if (description || description === '') {
		if (typeof description !== 'string') {
			errors.push('Description must be a string.');
		} else {
			if (description.length > 100) {
				errors.push('Description must be shorter than 100 characters.');
			}
		}
	}

	if (private) {
		if (typeof private !== 'boolean') {
			errors.push('Private must be a boolean.');
		}
	}

	return errors;
};

module.exports = {
	registerValidation,
	updateProfileValidation,
	resetPasswordValidation,
	listValidation,
};
