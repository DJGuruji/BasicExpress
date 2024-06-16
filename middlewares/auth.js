const jwt = require('jsonwebtoken');
const Blacklist = require('../models/Blacklist');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');

    try {
        const blacklisted = await Blacklist.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ message: 'Token has been blacklisted' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.user.id);

        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = auth;
