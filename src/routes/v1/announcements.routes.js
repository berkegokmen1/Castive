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

const express = require('express');
const multer = require('multer');
const createError = require('http-errors');

const auth = require('../../middlewares/check-auth');
const { moderator } = require('../../middlewares/check-role');

const {
  putNew,
  getLatest,
  getAll,
  getId,
  patchId,
  putImage,
  getImage,
  delImage,
  delId,
} = require('../../controllers/v1/announcements.controllers');

const router = express.Router();

const FILE_SIZE = process.env.ANNOUNCEMENT_IMAGE_FILESIZE || 1000000;

const upload = multer({
  limits: {
    fileSize: parseInt(FILE_SIZE),
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        createError.BadRequest('Please upload a supported image format.')
      );
    }

    cb(undefined, true);
  },
});

// /v1/announcements
router.put('/', auth, moderator, putNew);

router.get('/latest', auth, getLatest);

router.get('/', auth, getAll);

router.get('/:id', auth, getId);

router.patch('/:id', auth, moderator, patchId);

router.put('/:id/image', auth, moderator, upload.single('image'), putImage);

router.get('/:id/image', auth, getImage);

router.delete('/:id/image', auth, moderator, delImage);

router.delete('/:id', auth, moderator, delId);

module.exports = router;
