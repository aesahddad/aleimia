const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password, role } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
            }

            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' });
            }

            const newUser = await User.create({
                username,
                email,
                password,
                role: role === 'admin' ? 'customer' : (role || 'customer')
            });

            const accessToken = generateAccessToken(newUser._id);
            const refreshToken = generateRefreshToken(newUser._id);

            res.status(201).json({
                success: true,
                token: accessToken,
                refreshToken,
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                }
            });
        } catch (error) {
            console.error('Registration Error:', error);
            res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: 'بيانات الاعتماد غير صالحة' });
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ error: 'بيانات الاعتماد غير صالحة' });
            }

            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            res.json({
                success: true,
                token: accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
        }
    }

    static async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token required' });
            }

            const decoded = verifyRefreshToken(refreshToken);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            const newAccessToken = generateAccessToken(user._id);
            const newRefreshToken = generateRefreshToken(user._id);

            res.json({
                success: true,
                token: newAccessToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
    }
}

module.exports = AuthController;