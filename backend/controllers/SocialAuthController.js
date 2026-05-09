const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const REDIRECT_FAIL = `${FRONTEND_URL}/auth?mode=login&error=social_failed`;

class SocialAuthController {
  static authenticate(provider) {
    return (req, res, next) => {
      passport.authenticate(provider, { session: false })(req, res, next);
    };
  }

  static callback(provider) {
    return (req, res, next) => {
      passport.authenticate(provider, { session: false }, (err, data) => {
        if (err || !data || !data.token) return res.redirect(REDIRECT_FAIL);
        const params = new URLSearchParams({ token: data.token, refreshToken: data.refreshToken || '' });
        res.redirect(`${FRONTEND_URL}/auth/callback?${params}`);
      })(req, res, next);
    };
  }

  static async handleToken(req, res) {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).json({ error: 'Token required' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, token, refreshToken: req.query.refreshToken, user: { id: user._id, username: user.username, email: user.email, role: user.role, permissions: user.permissions } });
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

module.exports = SocialAuthController;
