const express = require('express');
const multer = require('multer');
const createError = require('http-errors');

const auth = require('../../middlewares/check-auth');

const {
  getMe,
  postMe,
  getLibrary,
  postLibrary,
  deleteLibrary,
  getList,
  patchList,
  deleteList,
  postListItems,
  deleteListItems,
  getListCover,
  putListCover,
  deleteListCover,
} = require('../../controllers/v1/lists.controllers');

const router = express.Router();

// Multer upload
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        createError.BadRequest('Please upload a supported image format.')
      );
    }

    cb(undefined, true);
  },
});

// Routes => /lists
router.get('/me', auth, getMe); // Lists of logged in user

router.post('/me', auth, postMe); // Create list

router.get('/library', auth, getLibrary); // Get library (following lists)

router.post('/library', auth, postLibrary); // Add to library

router.delete('/library', auth, deleteLibrary); // Remove from library

router.get('/:id', auth, getList); // Get list by id => /lists/:id?followers=true

router.post('/:id/items', auth, postListItems); // Add item to list

router.delete('/:id/items', auth, deleteListItems); // Add item to list

router.patch('/:id', auth, patchList); // Update list

router.delete('/:id', auth, deleteList); // Remove list

router.get('/:id/cover', auth, getListCover); // Get list cover

router.put('/:id/cover', auth, upload.single('cover'), putListCover); // Put list cover

router.delete('/:id/cover', auth, deleteListCover); // Delete list cover

module.exports = router;
