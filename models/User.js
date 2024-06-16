const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'staff', 'admin'],
        default: 'user',
      },
    profilePicture: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: '',
    },
    state: {
        type: String,
        default: '',
    },
    district: {
        type: String,
        default: '',
    },
    place: {
        type: String,
        default: '',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
