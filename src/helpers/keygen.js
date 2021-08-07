const crypto = require('crypto');

const key1 = crypto.randomBytes(32).toString('hex');
const key2 = crypto.randomBytes(32).toString('hex');
const key3 = crypto.randomBytes(32).toString('hex');

console.table({ ACCESS: key1, REFRESH: key2, EMAIL: key3 });
