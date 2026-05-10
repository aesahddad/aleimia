const logger = require('../shared/logger');

class SocialAuthService {
    static getProviderUrl(provider, redirectUri, state) {
        const urls = {
            facebook: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=email,public_profile`,
            linkedin: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20email`,
            tiktok: `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user.info.basic`,
            snapchat: `https://accounts.snapchat.com/accounts/oauth2/auth?response_type=code&client_id=${process.env.SNAPCHAT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=snapchat.login.api%20user.display_name%20user.bitmoji.avatar`,
            google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20email%20profile&response_type=code&access_type=offline`,
            apple: `https://appleid.apple.com/auth/authorize?client_id=${process.env.APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=name%20email&response_type=code`
        };
        return urls[provider] || null;
    }

    static async exchangeCode(provider, code, redirectUri) {
        switch (provider) {
            case 'facebook': return this.exchangeFacebook(code, redirectUri);
            case 'linkedin': return this.exchangeLinkedIn(code, redirectUri);
            case 'tiktok': return this.exchangeTikTok(code, redirectUri);
            case 'snapchat': return this.exchangeSnapchat(code, redirectUri);
            case 'google': return this.exchangeGoogle(code, redirectUri);
            case 'apple': return this.exchangeApple(code, redirectUri);
            default: throw new Error('Invalid provider');
        }
    }

    static async exchangeFacebook(code, redirectUri) {
        const appId = process.env.FACEBOOK_APP_ID;
        const secret = process.env.FACEBOOK_APP_SECRET;
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${secret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error(tokenData.error?.message || 'Facebook token exchange failed');

        const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
        const userData = await userRes.json();
        if (userData.error) throw new Error(userData.error.message);

        return {
            providerId: userData.id,
            email: userData.email || '',
            username: userData.name || `fb_${userData.id}`,
            avatar: userData.picture?.data?.url || ''
        };
    }

    static async exchangeLinkedIn(code, redirectUri) {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const secret = process.env.LINKEDIN_CLIENT_SECRET;
        const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: secret });
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');

        const userRes = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userData = await userRes.json();
        if (userData.error) throw new Error(userData.error_description);

        return {
            providerId: userData.sub,
            email: userData.email || '',
            username: userData.name || userData.given_name || `li_${userData.sub}`,
            avatar: userData.picture || ''
        };
    }

    static async exchangeTikTok(code, redirectUri) {
        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const secret = process.env.TIKTOK_CLIENT_SECRET;
        const params = new URLSearchParams({ client_key: clientKey, client_secret: secret, code, grant_type: 'authorization_code', redirect_uri: redirectUri });
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body: params });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error(tokenData.error_description || 'TikTok token exchange failed');

        const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,open_id', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userData = await userRes.json();
        const u = userData.data?.user || {};

        return {
            providerId: u.open_id || tokenData.open_id,
            email: '',
            username: u.display_name || `tt_${u.open_id}`,
            avatar: u.avatar_url || ''
        };
    }

    static async exchangeSnapchat(code, redirectUri) {
        const clientId = process.env.SNAPCHAT_CLIENT_ID;
        const secret = process.env.SNAPCHAT_CLIENT_SECRET;
        const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: secret });
        const tokenRes = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Snapchat token exchange failed');

        const userRes = await fetch('https://api.snapchat.com/login/v2/user/profile', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userData = await userRes.json();

        return {
            providerId: userData.user_id || userData.me?.userId,
            email: userData.email || '',
            username: userData.display_name || userData.me?.displayName || `sc_${userData.user_id}`,
            avatar: userData.bitmoji_url || userData.me?.bitmoji?.avatar || ''
        };
    }

    static async exchangeGoogle(code, redirectUri) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const secret = process.env.GOOGLE_CLIENT_SECRET;
        const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: secret });
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Google token exchange failed');

        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userData = await userRes.json();
        if (userData.error) throw new Error(userData.error.message);

        return {
            providerId: userData.id,
            email: userData.email || '',
            username: userData.name || `google_${userData.id}`,
            avatar: userData.picture || ''
        };
    }

    static async exchangeApple(code, redirectUri) {
        const clientId = process.env.APPLE_CLIENT_ID;
        const secret = process.env.APPLE_CLIENT_SECRET;
        const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, client_secret: secret });
        const tokenRes = await fetch('https://appleid.apple.com/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Apple token exchange failed');

        // Decode ID token JWT to get user info
        const payload = tokenData.id_token.split('.')[1];
        const userData = JSON.parse(Buffer.from(payload, 'base64').toString());

        return {
            providerId: userData.sub,
            email: userData.email || '',
            username: userData.email ? userData.email.split('@')[0] : `apple_${userData.sub.slice(0, 8)}`,
            avatar: ''
        };
    }
}

module.exports = SocialAuthService;