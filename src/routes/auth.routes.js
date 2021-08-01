const express = require('express');

const router = express.Router();

const auth = require('../middlewares/check-auth');

const {
	putRegister,
	postLogin,
	postRefresh,
	postLogout,
	postLogoutAll,
} = require('../controllers/auth.controllers');

// Routes => /auth
router.put('/register', putRegister);

router.post('/login', postLogin);

router.post('/refresh', postRefresh);

router.post('/logout', auth, postLogout);

router.post('/logoutall', auth, postLogoutAll);

module.exports = router;
