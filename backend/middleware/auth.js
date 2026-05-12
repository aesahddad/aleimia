const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            logger.error(error);
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
        return;
    }

    res.status(401).json({ error: 'Not authorized, no token' });
};

const hasPerm = (...required) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Not authorized' });
        const p = req.user.permissions || {};
        const ok = required.some(r => {
            const [group, perm] = r.split('.');
            return p[group] && p[group][perm] === true;
        });
        if (ok) return next();
        res.status(403).json({ error: 'غير مصرح لك' });
    };
};

const admin = hasPerm('ops.manage');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = { protect, admin, hasPerm, JWT_SECRET, JWT_REFRESH_SECRET, generateAccessToken, generateRefreshToken, verifyRefreshToken };

