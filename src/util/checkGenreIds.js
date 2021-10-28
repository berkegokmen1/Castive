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

const { default: axios } = require('axios');
const createError = require('http-errors');
const client = require('../db/redis.db');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const checkGenreIdsFormat = (ids) => {
  if (!Array.isArray(ids)) {
    return false;
  }

  if (!ids.every((id) => typeof id === 'number')) {
    return false;
  }

  if (!ids.every((id) => Number.isInteger(id))) {
    return false;
  }

  return true;
};

const checkGenreIdsCache = async (ids, type) => {
  // Use axios to make request to tmdb api, retrieve genres
  // Store genres in redis db with 24 hours of expiration
  // Compare the ids to the values that came from tmdb

  try {
    return new Promise((resolve, reject) => {
      client.get(`TMDB_GENRES:${type}`, async (err, reply) => {
        if (err) {
          return reject(createError.InternalServerError());
        }

        if (!reply) {
          // Not cached, make request and cache
          let response;

          try {
            response = await axios.get(
              `https://api.themoviedb.org/3/genre/${type}/list?api_key=${TMDB_API_KEY}&language=en-US`
            );
          } catch (error) {}

          if (!response) {
            return reject(
              createError.InternalServerError('Unable to reach tmdb.')
            );
          }

          const idList = response.data.genres.map((genre) => genre.id);

          // Store idList in redis
          // Not interested in errors and reply from saving
          client.set(
            `TMDB_GENRES:${type}`,
            JSON.stringify(idList),
            'EX',
            86400
          );

          const check = ids.every((id) => idList.includes(id));

          return resolve(check);
        } else {
          // Cache is present
          const idList = await JSON.parse(reply);

          const check = ids.every((id) => idList.includes(id));

          return resolve(check);
        }
      });
    });
  } catch (error) {
    return reject(error);
  }
};

module.exports = { checkGenreIdsFormat, checkGenreIdsCache };
