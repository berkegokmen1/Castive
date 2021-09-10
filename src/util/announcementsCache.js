const createError = require('http-errors');

const client = require('../db/redis.db');

const announcementsCache = async () => {
  return new Promise((resolve, reject) => {
    client.get('ANNOUNCEMENTS', (err, reply) => {
      if (err) {
        return reject(createError.InternalServerError());
      }

      return resolve(reply);
    });
  });
};

module.exports = announcementsCache;
