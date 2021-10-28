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

const validator = require('validator');

const registerValidation = (username, email, password, birthdate) => {
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

  if (!validator.isDate(birthdate)) {
    errors.push('Please enter a valid date format.');
  }

  return errors;
};

const updateProfileValidation = (email, birthdate) => {
  const errors = [];

  if (email || email === '') {
    if (typeof email !== 'string') {
      errors.push('Email must be a string.');
    } else {
      if (!validator.isEmail(email)) {
        errors.push('Email adress is not valid.');
      }
    }
  }

  if (birthdate) {
    if (!validator.isDate(birthdate)) {
      errors.push('Please enter a valid date format.');
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

  if (private === true || private === false) {
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
