const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword, logoutUser } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const upload = require('../middlewares/upload');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, upload.single('profilePicture'), updateUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);
router.post('/logout', auth, logoutUser);

router.get('/admin', auth, role('admin'), (req, res) => {
    res.json({ message: 'Welcome Admin' });
  });

module.exports = router;
