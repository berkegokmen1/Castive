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

const crypto = require('crypto');

const key1 = crypto.randomBytes(32).toString('hex');
const key2 = crypto.randomBytes(32).toString('hex');
const key3 = crypto.randomBytes(32).toString('hex');
const key4 = crypto.randomBytes(32).toString('hex');
const key5 = crypto.randomBytes(32).toString('hex');

console.table({
  ACCESS: key1,
  REFRESH: key2,
  VERIFICATION_MAIL: key3,
  FORGOT_PASSWORD_MAIL: key4,
  MONGODB_PASS: key5,
});
