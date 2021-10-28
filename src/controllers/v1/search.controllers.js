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

const createError = require('http-errors');

const User = require('../../models/user.model');
const List = require('../../models/list.model');

const getUsers = async (req, res, next) => {
  try {
    if (!req.query.q) {
      return next(createError.BadRequest('Please provide a query string.'));
    }

    if (req.query.q.length > 16) {
      return next(
        createError.BadRequest(
          'Query string cannot be longer than 16 characters.'
        )
      );
    }

    const result = await User.search(req.query.q, req.user._id);

    return res.json({
      success: true,
      Data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLists = async (req, res, next) => {
  try {
    if (!req.query.q) {
      return next(createError.BadRequest('Please provide a query string.'));
    }

    if (req.query.q.length > 25) {
      return next(
        createError.BadRequest(
          'Query string cannot be longer than 25 characters.'
        )
      );
    }

    const result = await List.search(req.query.q, req.user._id);

    return res.json({
      success: true,
      Data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getLists,
};
