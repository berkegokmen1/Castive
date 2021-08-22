const isNumeric = (value) => {
	return /^\d+$/.test(value);
};

module.exports = isNumeric;
