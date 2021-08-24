const express = require('express');

const router = express.Router();

const auth = require('../middlewares/check-auth');
const { getUsers, getLists } = require('../controllers/search.controllers');

router.get('/users', auth, getUsers);

router.get('/lists', auth, getLists);

module.exports = router;
