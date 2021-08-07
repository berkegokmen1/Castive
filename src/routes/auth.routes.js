const express = require('express');

const router = express.Router();

const auth = require('../middlewares/check-auth');

const {
	putRegister,
	postLogin,
	postRefresh,
	postLogout,
	postLogoutAll,
	postVerifyEmail,
	postRequestNewMail,
} = require('../controllers/auth.controllers');

// Routes => /auth
router.put('/register', putRegister);

router.post('/login', postLogin);

router.post('/refresh', postRefresh);

router.post('/logout', auth, postLogout);

router.post('/logoutall', auth, postLogoutAll);

router.post('/verify/:token', postVerifyEmail);

router.post('/requestnewmail', postRequestNewMail);

module.exports = router;
