const validator = require('validator');

const registerValidation = (username, age, email, password, password2) => {
	// username => no special chars, min 2, max 16, no white space
	// age => greater than or equal to 0
	// email => valid email
	// password => 1 uppercase, 1 lowercase, min 6, max 25, 1 special char, no white space, no username
	// password, password2 => matching

	const errors = [];

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
	}

	if (password === '') {
		errors.push('Passwords cannot be blank.');
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

	if (age < 0) {
		errors.push('Age cannot be less than 0.');
	}

	if (!validator.isEmail(email)) {
		errors.push('Email adress is not valid.');
	}

	return errors;
};

const updateProfileValidation = (email, age, phoneNumber) => {
	const errors = [];

	if (age) {
		if (age < 0) {
			errors.push('Age cannot be less than 0.');
		}
	}

	if (email) {
		if (!validator.isEmail(email)) {
			errors.push('Email adress is not valid.');
		}
	}

	if (phoneNumber) {
		if (!validator.isMobilePhone(phoneNumber)) {
			errors.push('Phone number is not valid.');
		}
	}

	return errors;
};

const resetPasswordValidation = (password) => {
	const errors = [];

	if (password === '') {
		errors.push('Passwords cannot be blank.');
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

	return errors;
};

module.exports = {
	registerValidation,
	updateProfileValidation,
	resetPasswordValidation,
};
