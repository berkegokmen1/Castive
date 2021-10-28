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

const {
  getMe,
  postMe,
  getLibrary,
  postLibrary,
  deleteLibrary,
  getList,
  patchList,
  deleteList,
  postListItems,
  deleteListItems,
  getListCover,
  putListCover,
  deleteListCover,
} = require('../../controllers/v1/lists.controllers');

const router = express.Router();

const FILE_SIZE = process.env.LIST_COVER_FILESIZE || 1000000;

// Multer upload
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

// Routes => /lists
router.get('/me', auth, getMe); // Lists of logged in user

router.post('/me', auth, postMe); // Create list

router.get('/library', auth, getLibrary); // Get library (following lists)

router.post('/library', auth, postLibrary); // Add to library

router.delete('/library', auth, deleteLibrary); // Remove from library

router.get('/:id', auth, getList); // Get list by id => /lists/:id?followers=true

router.post('/:id/items', auth, postListItems); // Add item to list

router.delete('/:id/items', auth, deleteListItems); // Add item to list

router.patch('/:id', auth, patchList); // Update list

router.delete('/:id', auth, deleteList); // Remove list

router.get('/:id/cover', auth, getListCover); // Get list cover

router.put('/:id/cover', auth, upload.single('cover'), putListCover); // Put list cover

router.delete('/:id/cover', auth, deleteListCover); // Delete list cover

module.exports = router;
