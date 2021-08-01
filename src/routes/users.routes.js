const express = require('express');
const multer = require('multer');

const auth = require('../middlewares/check-auth');

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

const {
	getMe,
	getMeAvatar,
	putMeAvatar,
	deleteMeAvatar,
	patchMe,
	deleteMe,
	getUserId,
	getUserIdAvatar,
} = require('../controllers/users.controllers');

// Routes => /users
router.get('/me', auth, getMe); // Profile of logged id user

router.get('/me/avatar', auth, getMeAvatar); // Avatar of logged in user

router.put('/me/avatar', auth, upload.single('avatar'), putMeAvatar); // Upload avatar

router.delete('/me/avatar', auth, deleteMeAvatar);

router.patch('/me', auth, patchMe); // Update logged in user's profile

router.delete('/me', auth, deleteMe); // Delete account of logged in user

router.get('/:userId', auth, getUserId); // Public profile of another user

router.get('/:userId/avatar', auth, getUserIdAvatar); // Avatar of another profile

module.exports = router;
