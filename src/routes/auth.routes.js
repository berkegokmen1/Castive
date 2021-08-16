const express = require('express');

const router = express.Router();

const auth = require('../middlewares/check-auth');

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
} = require('../controllers/auth.controllers');

const { authLimiter, requestMailLimiter } = require('../util/limiter');

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
