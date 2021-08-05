const redis = require('redis');

const client = redis.createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
	password: process.env.REDIS_PASSWORD,
});

client.on('connect', () => {});

client.on('ready', () => {
	console.log('Redis connected.');
});

client.on('end', () => {
	process.exit();
});

client.on('error', (err) => {
	console.log(err.message);
});

process.on('SIGINT', () => {
	client.quit();
});

module.exports = client;
