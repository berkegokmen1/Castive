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

const rateLimit = require('express-rate-limit');
const createError = require('http-errors');
const RedisStore = require('rate-limit-redis');

const client = require('../db/redis.db');

const authLimiter = rateLimit({
  store: new RedisStore({
    client,
  }),
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 requests per windowMs
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
