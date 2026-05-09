const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const OAuth2Strategy = require('passport-oauth2').Strategy;
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

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      callbackURL: `${FRONTEND_URL}/api/auth/apple/callback`,
      scope: ['name', 'email']
    }, (req, accessToken, refreshToken, idToken, profile, done) => {
      profile = profile || {};
      profile.email = profile.email || (idToken ? JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString()).email : null);
      profile.displayName = profile.name?.firstName ? `${profile.name.firstName} ${profile.name.lastName || ''}`.trim() : 'Apple User';
      profile.emails = profile.email ? [{ value: profile.email }] : [];
      findOrCreateUser(profile, 'apple', done);
    }));
  }

  if (process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET) {
    passport.use('tiktok', new OAuth2Strategy({
      authorizationURL: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenURL: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientID: process.env.TIKTOK_CLIENT_ID,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      callbackURL: `${FRONTEND_URL}/api/auth/tiktok/callback`,
      scope: ['user.info.basic']
    }, (accessToken, refreshToken, params, profile, done) => {
      (async () => {
        try {
          const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,email', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          const tikProfile = data?.data?.user || {};
          profile = profile || {};
          profile.displayName = tikProfile.display_name || 'TikTok User';
          profile.email = tikProfile.email;
          profile.emails = profile.email ? [{ value: profile.email }] : [];
          findOrCreateUser(profile, 'tiktok', done);
        } catch (e) {
          done(e, null);
        }
      })();
    }));
  }

  if (process.env.SNAPCHAT_CLIENT_ID && process.env.SNAPCHAT_CLIENT_SECRET) {
    passport.use('snapchat', new OAuth2Strategy({
      authorizationURL: 'https://accounts.snapchat.com/accounts/oauth2/auth',
      tokenURL: 'https://accounts.snapchat.com/accounts/oauth2/token',
      clientID: process.env.SNAPCHAT_CLIENT_ID,
      clientSecret: process.env.SNAPCHAT_CLIENT_SECRET,
      callbackURL: `${FRONTEND_URL}/api/auth/snapchat/callback`,
      scope: ['user.display_name']
    }, (accessToken, refreshToken, params, profile, done) => {
      (async () => {
        try {
          const res = await fetch('https://kit.snapchat.com/v1/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          profile = profile || {};
          profile.displayName = data?.data?.me?.display_name || 'Snapchat User';
          profile.email = data?.data?.me?.email;
          profile.emails = profile.email ? [{ value: profile.email }] : [];
          findOrCreateUser(profile, 'snapchat', done);
        } catch (e) {
          done(e, null);
        }
      })();
    }));
  }
}

module.exports = { init };
