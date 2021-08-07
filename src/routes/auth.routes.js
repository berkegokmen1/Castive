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
	postRequestVerificationMail,
	postReset,
	postRequestResetMail,
} = require('../controllers/auth.controllers');

// Routes => /auth
router.put('/register', putRegister);

router.post('/login', postLogin);

router.post('/refresh', postRefresh);

router.post('/logout', auth, postLogout);

router.post('/logoutall', auth, postLogoutAll);

router.post('/verify', postVerifyEmail);

router.post('/reset', postReset);

router.post('/request/verification', postRequestVerificationMail);

router.post('/request/reset', postRequestResetMail);

module.exports = router;
