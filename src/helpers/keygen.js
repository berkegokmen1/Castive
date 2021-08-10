const crypto = require('crypto');

const key1 = crypto.randomBytes(32).toString('hex');
const key2 = crypto.randomBytes(32).toString('hex');
const key3 = crypto.randomBytes(32).toString('hex');
const key4 = crypto.randomBytes(32).toString('hex');
const key5 = crypto.randomBytes(32).toString('hex');

console.table({
	ACCESS: key1,
	REFRESH: key2,
	VERIFICATION_MAIL: key3,
	FORGOT_PASSWORD_MAIL: key4,
	MONGODB_PASS: key5,
});
