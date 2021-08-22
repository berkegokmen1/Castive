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
					const response = await axios.get(
						`https://api.themoviedb.org/3/genre/${type}/list?api_key=${TMDB_API_KEY}&language=en-US`
					);
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
		throw error;
	}
};

module.exports = { checkGenreIdsFormat, checkGenreIdsCache };
