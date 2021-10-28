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

const router = express.Router();

const auth = require('../../middlewares/check-auth');

const {
  putRegister,
  postLogin,
  postRefresh,
  postLogout,
  postLogoutAll,
  patchVerifyEmail,
  postRequestVerificationMail,
  patchReset,
  postRequestResetMail,
} = require('../../controllers/v1/auth.controllers');

const { authLimiter, requestMailLimiter } = require('../../util/limiter');

// Routes => /auth
router.put('/register', authLimiter, putRegister);

router.post('/login', authLimiter, postLogin);

router.post('/refresh', authLimiter, postRefresh);

router.post('/logout', auth, postLogout);

router.post('/logoutall', auth, postLogoutAll);

router.patch('/verify', patchVerifyEmail);

router.post(
  '/request/verification',
  requestMailLimiter,
  postRequestVerificationMail
);

router.patch('/reset', patchReset);

router.post('/request/reset', requestMailLimiter, postRequestResetMail);

module.exports = router;
