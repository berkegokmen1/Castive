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

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: undefined,
      required: true,
    },
    original: {
      type: Buffer,
      default: undefined,
    },
    small: {
      type: Buffer,
      default: undefined,
    },
    medium: {
      type: Buffer,
      default: undefined,
    },
  },
  {
    versionKey: false,
    id: false,
  }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
