const rateLimit = require('express-rate-limit');
const createError = require('http-errors');
const RedisStore = require('rate-limit-redis');

const client = require('../db/redis.db');

const authLimiter = rateLimit({
	store: new RedisStore({
		client,
	}),
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 10, // limit each IP to 10 requests per windowMs
	headers: false,
	handler: (_req, _res, next) => {
		return next(createError.TooManyRequests('Too many requests'));
	},
});

const requestMailLimiter = rateLimit({
	store: new RedisStore({
		client,
	}),
	windowMs: 59 * 1000, // 1 minute (59 secs)
	max: 1, // limit each IP to 1 request per windowMs
	headers: false,
	handler: (_req, _res, next) => {
		return next(createError.TooManyRequests('Too many requests'));
	},
});

module.exports = { authLimiter, requestMailLimiter };
