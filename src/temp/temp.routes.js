const express = require('express');
const path = require('path');

const router = express.Router();

const { getVerifyEmail, getResetPassword } = require('./temp.controllers');

router.get('/auth/verify/:token', getVerifyEmail);

router.get('/auth/reset/:token', getResetPassword);

module.exports = router;
