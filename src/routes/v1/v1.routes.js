const express = require('express');

const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const listsRoutes = require('./lists.routes');
const searchRoutes = require('./search.routes');

// /v1/

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

router.use('/lists', listsRoutes);

router.use('/search', searchRoutes);

module.exports = router;
