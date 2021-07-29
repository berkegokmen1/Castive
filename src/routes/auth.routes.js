const express = require('express');

const router = express.Router();

const {
  putRegister,
  postLogin,
  postRefresh,
  postLogout,
  postLogoutAll,
} = require('../controllers/auth.controllers');

// Routes
router.put('/register', putRegister);

router.post('/login', postLogin);

router.post('/refresh', postRefresh);

router.post('/logout', postLogout);

router.post('/logoutall', postLogoutAll);

module.exports = router;
