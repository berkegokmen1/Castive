const createError = require('http-errors');

const checkGenreIds = (ids) => {
	if (!Array.isArray(ids)) {
		return false;
	}

	if (!ids.every((id) => typeof id === 'number')) {
		return false;
	}

	if (!ids.every((id) => Number.isInteger(id))) {
		return false;
	}

	// If an invalid genre id were to be saved, the response from tmdb will yield 0 results,
	// therefore, ...

	return true;
};

module.exports = checkGenreIds;
