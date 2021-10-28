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

const router = express.Router();

const FILE_SIZE = process.env.USER_AVATAR_FILESIZE || 1000000;

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

const {
  getMe,
  getMeAvatar,
  putMeAvatar,
  deleteMeAvatar,
  getMeInterests,
  putMeInterests,
  deleteMeInterests,
  patchMe,
  deleteMe,
  getUserUsername,
  getUserUsernameAvatar,
  postFollow,
  postUnfollow,
  postBlock,
  postUnblock,
} = require('../../controllers/v1/users.controllers');

// Routes => /users
router.get('/me', auth, getMe); // /users/me?all=1 or /users/me?following=1&followers=0&lists=true&blocked=false&library=1

router.get('/me/avatar', auth, getMeAvatar); // Avatar of logged in user

router.put('/me/avatar', auth, upload.single('avatar'), putMeAvatar); // Upload avatar

router.delete('/me/avatar', auth, deleteMeAvatar);

router.get('/me/interests', auth, getMeInterests);

router.put('/me/interests/:type/:incexc', auth, putMeInterests); // /me/inserests/tv/include or /me/inserests/movie/exclude

router.delete('/me/interests/:type/:incexc', auth, deleteMeInterests); // /me/inserests/tv/include or /me/inserests/movie/exclude

router.patch('/me', auth, patchMe); // Update logged in user's profile

router.delete('/me', auth, deleteMe); // Delete account of logged in user

router.get('/:username', auth, getUserUsername); // /users/:id?following=1&followers=0&lists=true

router.get('/:username/avatar', auth, getUserUsernameAvatar); // Avatar of another profile

router.post('/follow', auth, postFollow); // /follow?username=berkegokmen1

router.post('/unfollow', auth, postUnfollow); // /unfollow?username=berkegokmen1

router.post('/block', auth, postBlock); // /block?username=berkegokmen1

router.post('/unblock', auth, postUnblock); // /unblock?username=berkegokmen1

module.exports = router;
