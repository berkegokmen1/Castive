const express = require('express');
const multer = require('multer');

const router = express.Router();

// Multer upload
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a supported format.'));
    }

    cb(undefined, true);
  },
});

const {} = require('../controllers/users.controllers');

// Routes
router.get('/me');

router.put('/me/avatar', upload.single('avatar'));

module.exports = router;
