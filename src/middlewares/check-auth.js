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

const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const User = require('../models/user.model');
const client = require('../db/redis.db');

const auth = async (req, res, next) => {
  const accessTokenHeader = req.header('Authorization');
  if (!accessTokenHeader) {
    return next(createError.Unauthorized());
  }

  let accessToken;
  try {
    accessToken = accessTokenHeader.split(' ')[1]; // Access token
  } catch (error) {
    return next(createError.BadRequest('Invalid format for the token.'));
  }

  jwt.verify(
    accessToken,
    process.env.JWT_ACCESS_SECRET,
    async (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthroized' : err.message;

        return next(createError.Unauthorized(message));
      }

      // Find user and attach to the req object
      const user = await User.findById(payload.aud /* userId */).exec();

      if (!user) {
        return next(createError.Unauthorized());
      }

      client.GET(`AT:${accessToken}:${user._id.toString()}`, (err, reply) => {
        if (err) {
          return next(createError.InternalServerError());
        }

        // Check if the token is valid, ie. in the db
        if (!reply) {
          return next(createError.Unauthorized());
        }
        // Attach user to the request
        req.user = user;
        return next();
      });
    }
  );
};

module.exports = auth;
