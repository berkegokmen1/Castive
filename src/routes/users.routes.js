const express = require('express');
const multer = require('multer');
const createError = require('http-errors');

const auth = require('../middlewares/check-auth');

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

const {
	getMe,
	getMeAvatar,
	putMeAvatar,
	deleteMeAvatar,
	patchMe,
	deleteMe,
	getUserUsername,
	getUserUsernameAvatar,
	postFollow,
	postUnfollow,
	postBlock,
	postUnblock,
} = require('../controllers/users.controllers');

// Routes => /users
router.get('/me', auth, getMe); // Profile of logged id user

router.get('/me/avatar', auth, getMeAvatar); // Avatar of logged in user

router.put('/me/avatar', auth, upload.single('avatar'), putMeAvatar); // Upload avatar

router.delete('/me/avatar', auth, deleteMeAvatar);

router.patch('/me', auth, patchMe); // Update logged in user's profile

router.delete('/me', auth, deleteMe); // Delete account of logged in user

router.get('/:username', auth, getUserUsername); // Public profile of another user

router.get('/:username/avatar', auth, getUserUsernameAvatar); // Avatar of another profile

router.post('/follow', auth, postFollow); // /follow?username=berkegokmen1

router.post('/unfollow', auth, postUnfollow); // /unfollow?username=berkegokmen1

router.post('/block', auth, postBlock); // /block?username=berkegokmen1

router.post('/unblock', auth, postUnblock); // /unblock?username=berkegokmen1

module.exports = router;
