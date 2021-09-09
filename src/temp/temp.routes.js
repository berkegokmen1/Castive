const express = require('express');

const router = express.Router();

const { getVerifyEmail, getResetPassword } = require('./temp.controllers');

router.get('/v1/auth/verify/:token', getVerifyEmail);

router.get('/v1/auth/reset/:token', getResetPassword);

module.exports = router;
