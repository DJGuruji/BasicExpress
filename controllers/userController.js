const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const transporter = require('../config/nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const Blacklist = require('../models/Blacklist');


dotenv.config();

const registerUser = async (req, res) => {
    const { username, password1, password2, email, mobile, role } = req.body;
  
    if (password1 !== password2) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
  
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      user = new User({
        username,
        email,
        password: password1,
        mobile,
        role: role || 'user', // Default role is 'user'
      });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password1, salt);
  
      await user.save();
  
      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };

// Login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    const { country, state, district, place } = req.body;
    const profilePicture = req.file ? req.file.path : '';

    try {
        const user = await User.findById(req.user.id);

        if (profilePicture) user.profilePicture = profilePicture;
        if (country) user.country = country;
        if (state) user.state = state;
        if (district) user.district = district;
        if (place) user.place = place;

        await user.save();

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordExpire = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetPasswordExpire;
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

        await transporter.sendMail({
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Password reset token',
            text: message,
        });

        res.status(200).json({ message: 'Email sent' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const resetPassword = async (req, res) => {
    const { resetToken } = req.params;
    const { password1, password2 } = req.body;

    if (password1 !== password2) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password1, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};



const logoutUser = async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');

    try {
        await Blacklist.create({ token });
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    logoutUser,
};
