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
const apiV1Routes = require('./routes/v1/v1.routes');

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
app.use('/v1', apiV1Routes);

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
  if (process.env.NODE_ENV !== 'production') {
    console.log(error);
  }

  const errorsBlacklist = ['CastError', 'TypeError'];

  return res.status(error.statusCode || 500).json({
    success: false,
    Data: {
      error: !errorsBlacklist.includes(error.name) ? error.message : 'error',
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
      require('./middlewares/ensure-updates')();
      console.log('Server is up and running on port', PORT);
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit();
  });
