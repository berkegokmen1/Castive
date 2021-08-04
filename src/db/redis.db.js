const redis = require('redis');

const connectRedis = () => {
	return new Promise((resolve, reject) => {
		const client = redis.createClient({
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
			password: process.env.REDIS_PASSWORD,
		});

		client.on('connect', () => {});

		client.on('ready', () => {
			console.log('Redis connected.');
			resolve(client);

			module.exports = client;
			// client.RPUSH('TEST', 'ok', (err, reply) => {
			// 	client.LREM('TEST', 1, 'token', (err, reply) => {
			// 		console.log(reply);
			// 		client.LRANGE('TEST', 0, -1, (err, reply) => {
			// 			console.log(reply);
			// 		});
			// 	});
			// });
		});

		client.on('end', () => {
			process.exit();
		});

		client.on('error', (err) => {
			console.log(err.message);
			reject();
		});

		process.on('SIGINT', () => {
			client.quit();
			reject();
		});
	});
};

module.exports = connectRedis;
