const User = require('../models/User');
const SocialAuthService = require('../services/SocialAuthService');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const logger = require('../shared/logger');

class SocialAuthController {
    static async getUrl(req, res) {
        try {
            const { provider } = req.params;
            const redirectUri = req.query.redirect_uri || `${req.protocol}://${req.get('host')}/auth/social/callback`;
            const state = Math.random().toString(36).substr(2, 15);
            const url = SocialAuthService.getProviderUrl(provider, redirectUri, state);
            if (!url) return res.status(400).json({ error: 'مزود غير مدعوم' });
            res.json({ url, state });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async callback(req, res) {
        try {
            const { provider } = req.params;
            const { code, redirect_uri } = req.body;
            if (!code) return res.status(400).json({ error: 'Authorization code required' });

            const redirectUri = redirect_uri || `${req.protocol}://${req.get('host')}/auth/social/callback`;
            const profile = await SocialAuthService.exchangeCode(provider, code, redirectUri);
            if (!profile.providerId) return res.status(400).json({ error: 'فشل الحصول على بيانات المستخدم' });

            const socialField = `${provider}Id`;
            let user = await User.findOne({ [`social.${socialField}`]: profile.providerId });

            if (!user && profile.email) {
                user = await User.findOne({ email: profile.email });
            }

            if (user) {
                if (!user.social) user.social = {};
                user.social[socialField] = profile.providerId;
                if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
                await user.save();
            } else {
                const username = profile.username || `${provider}_${profile.providerId.slice(0, 8)}`;
                const email = profile.email || `${provider}_${profile.providerId}@social.aleinia.com`;
                user = await User.create({
                    username,
                    email,
                    password: Math.random().toString(36).substr(2, 20),
                    role: 'customer',
                    avatar: profile.avatar || '',
                    social: { [socialField]: profile.providerId }
                });
            }

            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);
            user.refreshTokens.push(refreshToken);
            if (user.refreshTokens.length > 5) user.refreshTokens.shift();
            await user.save();

            res.json({
                success: true,
                token: accessToken,
                refreshToken,
                user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, permissions: user.permissions }
            });
        } catch (e) {
            logger.error(`${req.params.provider} social auth error:`, e);
            res.status(500).json({ error: e.message || 'فشل تسجيل الدخول عبر الشبكة الاجتماعية' });
        }
    }
}

module.exports = SocialAuthController;