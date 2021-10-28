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

const client = require('../db/redis.db');

const ACCESS_EXPIRATION = parseInt(process.env.JWT_ACCESS_EXPIRATION); // 5 mins
const REFRESH_EXPIRATION = parseInt(process.env.JWT_REFRESH_EXPIRATION); // 1 year
const RESET_PASSWORD_EXPIRATION = parseInt(
  process.env.JWT_RESET_PASSWORD_EXPIRATION
); // 15mins

/**
 * Store jwt tokens in http-only cookies => does not allow access or modification to token
 * Storing in local storage => X
 */

const signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {},
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: ACCESS_EXPIRATION,
        issuer: process.env.JWT_ISSUER,
        audience: userId,
      },
      (err, token) => {
        if (err) {
          return reject(createError.InternalServerError());
        }

        client.set(
          `AT:${token}:${userId}`,
          1,
          'EX' /* expiration */,
          ACCESS_EXPIRATION /* seconds */,
          (err, reply) => {
            if (err) {
              return reject(createError.InternalServerError());
            }

            return resolve(token);
          }
        );
      }
    );
  });
};

const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {},
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_EXPIRATION,
        issuer: process.env.JWT_ISSUER,
        audience: userId,
      },
      (err, token) => {
        if (err) {
          return reject(createError.InternalServerError());
        }

        client.set(
          `RT:${token}:${userId}`,
          1,
          'EX' /* expiration */,
          REFRESH_EXPIRATION /* seconds */,
          (err, reply) => {
            if (err) {
              return reject(createError.InternalServerError());
            }

            return resolve(token);
          }
        );
      }
    );
  });
};

const signEmailToken = (email) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {},
      process.env.JWT_EMAIL_SECRET,
      {
        issuer: process.env.JWT_ISSUER,
        audience: email,
      },
      (err, token) => {
        if (err) {
          return reject(createError.InternalServerError());
        }

        return resolve(token);
      }
    );
  });
};

const signResetToken = (email) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {},
      process.env.JWT_RESET_PASSWORD_SECRET,
      {
        expiresIn: RESET_PASSWORD_EXPIRATION,
        issuer: process.env.JWT_ISSUER,
        audience: email,
      },
      (err, token) => {
        if (err) {
          return reject(createError.InternalServerError());
        }

        client.set(
          `RESET:${token}`,
          1,
          'EX' /* expiration */,
          RESET_PASSWORD_EXPIRATION /* seconds */,
          (err, reply) => {
            if (err) {
              return reject(createError.InternalServerError());
            }

            return resolve(token);
          }
        );
      }
    );
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  signResetToken,
};
