const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

function findOrCreateUser(profile, provider, done) {
  const email = profile.emails?.[0]?.value || profile.email;
  const name = profile.displayName || profile.username || email?.split('@')[0] || 'User';
  (async () => {
    try {
      if (!email) return done(null, null);
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ username: name, email, password: Math.random().toString(36), role: 'customer' });
      }
      const token = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      done(null, { token, refreshToken, user: { id: user._id, username: user.username, email: user.email, role: user.role, permissions: user.permissions } });
    } catch (e) {
      done(e, null);
    }
  })();
}

function init() {
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${FRONTEND_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails', 'photos']
    }, (accessToken, refreshToken, profile, done) => findOrCreateUser(profile, 'facebook', done)));
  }

  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${FRONTEND_URL}/api/auth/linkedin/callback`,
      scope: ['openid', 'profile', 'email']
    }, (accessToken, refreshToken, profile, done) => findOrCreateUser(profile, 'linkedin', done)));
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${FRONTEND_URL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    }, (accessToken, refreshToken, profile, done) => findOrCreateUser(profile, 'google', done)));
  }
}

module.exports = { init };
