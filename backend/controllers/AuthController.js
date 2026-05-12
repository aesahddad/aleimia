const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWT_SECRET } = require('../middleware/auth');
const { success, error } = require('../utils/response');

class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password, role } = req.body;

            const userExists = await User.findOne({ email });
            if (userExists) {
                return error(res, 'هذا البريد الإلكتروني مسجل بالفعل', 400);
            }

            const newUser = await User.create({
                username, email, password,
                role: role === 'admin' ? 'customer' : (role || 'customer')
            });

            const accessToken = generateAccessToken(newUser._id);
            const refreshToken = generateRefreshToken(newUser._id);

            newUser.refreshTokens.push(refreshToken);
            await newUser.save();

            return success(res, {
                token: accessToken,
                refreshToken,
                user: {
                    id: newUser._id, username: newUser.username,
                    email: newUser.email, role: newUser.role,
                    permissions: newUser.permissions
                }
            }, 201);
        } catch (err) {
            logger.error('Registration Error:', err);
            return error(res, 'حدث خطأ أثناء إنشاء الحساب');
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) return error(res, 'بيانات الاعتماد غير صالحة', 401);

            const isMatch = await user.matchPassword(password);
            if (!isMatch) return error(res, 'بيانات الاعتماد غير صالحة', 401);

            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshTokens.push(refreshToken);
            if (user.refreshTokens.length > 5) user.refreshTokens.shift();
            await user.save();

            return success(res, {
                token: accessToken, refreshToken,
                user: {
                    id: user._id, username: user.username,
                    email: user.email, role: user.role,
                    permissions: user.permissions
                }
            });
        } catch (err) {
            logger.error('Login Error:', err);
            return error(res, 'حدث خطأ أثناء تسجيل الدخول');
        }
    }

    static async refresh(req, res) {
        try {
            const { refreshToken } = req.body;

            const decoded = verifyRefreshToken(refreshToken);
            const user = await User.findById(decoded.id);
            
            if (!user || !user.refreshTokens.includes(refreshToken)) {
                return error(res, 'Invalid or expired refresh token', 401);
            }

            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
            
            const newAccessToken = generateAccessToken(user._id);
            const newRefreshToken = generateRefreshToken(user._id);
            
            user.refreshTokens.push(newRefreshToken);
            await user.save();

            return success(res, { token: newAccessToken, refreshToken: newRefreshToken });
        } catch (err) {
            return error(res, 'Invalid or expired refresh token', 401);
        }
    }

    static async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                const decoded = jwt.decode(refreshToken);
                if (decoded?.id) {
                    const user = await User.findById(decoded.id);
                    if (user) {
                        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
                        await user.save();
                    }
                }
            }
            return success(res, { message: 'Logged out successfully' });
        } catch (e) {
            return error(res, 'Logout failed');
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) return error(res, 'لا يوجد حساب بهذا البريد', 404);

            const resetToken = jwt.sign({ id: user._id, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpire = Date.now() + 3600000;
            await user.save();

            try {
                const MailService = require('../services/MailService');
                await MailService.sendPasswordReset(email, resetToken);
            } catch (mailErr) {
                logger.error('Failed to send email:', mailErr);
            }

            return success(res, { message: 'تم إرسال رابط إعادة تعيين كلمة المرورة إلى بريدك الإلكتروني' });
        } catch (err) {
            return error(res, 'حدث خطأ أثناء طلب إعادة التعيين');
        }
    }

    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return error(res, 'الرمز غير صالح أو منتهي الصلاحية', 400);
            }

            const user = await User.findById(decoded.id);
            if (!user || user.resetPasswordToken !== token) {
                return error(res, 'الرمز غير صالح', 400);
            }

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return success(res, { message: 'تم إعادة تعيين كلمة المرور بنجاح' });
        } catch (err) {
            return error(res, 'حدث خطأ أثناء إعادة التعيين');
        }
    }
}

module.exports = AuthController;
