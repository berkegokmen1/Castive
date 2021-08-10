if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const createError = require('http-errors');

// Route imports
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

const connectMongoose = require('./db/mongoose.db');

const app = express();

// Helper middlewares

// Behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
app.set('trust proxy', 1);

// Https redirection
if (process.env.NODE_ENV === 'production') {
	app.use((req, res, next) => {
		if (req.header('x-forwarded-proto') !== 'https') {
			res.redirect('https://' + req.header('host') + req.url);
		} else {
			next();
		}
	});
} else {
	// Logger
	app.use(morgan('dev'));
}

// Parse body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Response header
app.use(helmet());

// Cors
app.options('*', cors()); // ???
app.use(
	cors({
		origin: [
			process.env.BASE_URL /* backend */,
			'http://localhost:3000' /* frontend */,
		],
	})
);

// Prevent against nosql query injection attacks
app.use(
	mongoSanitize({
		onSanitize: (_) => {
			throw createError.Forbidden();
		},
	})
);

// Prevent against xss attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.use(
	compression({
		filter: (req, res) => {
			if (req.headers['x-no-compression']) return false;
			return compression.filter(req, res);
		},
	})
);

// Route registers
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

// Temp route
const tempRoutes = require('./temp/temp.routes');
app.use('/', tempRoutes);

// 404 Route
app.use('*', (req, res, next) => {
	return res.status(404).json({
		success: false,
		Data: {
			error: 'Endpoint not found.',
		},
	});
});

// Error handlers
app.use((error, req, res, next) => {
	console.log(error);
	return res.status(error.statusCode || 500).json({
		success: false,
		Data: {
			error: error.message,
		},
	});
});

// DB Connections and server initializing
connectMongoose()
	.then((_) => {
		// Initialize redis
		require('./db/redis.db');

		const PORT = process.env.PORT || 4000;
		app.listen(PORT, (_) => {
			console.log('Server is up and running on port', PORT);
		});
	})
	.catch((err) => {
		console.log(err);
		process.exit();
	});
