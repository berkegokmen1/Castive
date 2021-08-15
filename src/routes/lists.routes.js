const express = require('express');
const createError = require('http-errors');

const auth = require('../middlewares/check-auth');

const { getMe, postMe } = require('../controllers/lists.controllers');

const router = express.Router();

// Routes => /lists
router.get('/me', auth, getMe); // Lists of logged in user

router.post('/me', auth, postMe);

module.exports = router;
