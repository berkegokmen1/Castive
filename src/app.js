require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
// const https = require('https');

// Route imports
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

// DB initializers imports
const connectMongoose = require('./db/mongoose.db');
const connectRedis = require('./db/redis.db');

const app = express();
// const server = https.createServer({}, app);

// Helper middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(
	compression({
		filter: (req, res) => {
			if (req.headers['x-no-compression']) return false;
			return compression.filter(req, res);
		},
	})
);

app.get('/', (_, res) => {
	res.json({
		Data: {
			message: 'Hi from /',
		},
		success: true,
	});
});

// Route registers
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

// Error handlers
app.use((error, req, res, next) => {
	return res.status(err.statusCode || 500).json({
		success: false,
		Data: {
			error: err.message,
		},
	});
});

// DB Connections and server initializing
Promise.all([connectMongoose(), connectRedis()])
	.then(([result, client]) => {
		module.exports = {
			client,
		};

		app.listen(process.env.PORT || 4000, (_) => {
			console.log('Server is up and running on port', process.env.PORT || 4000);
		});
	})
	.catch((err) => {
		console.log(err);
		process.exit();
	});
