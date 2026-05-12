const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const { JWT_SECRET } = require('./auth'); // Ensure we import the secret

const checkMaintenance = async (req, res, next) => {
    try {
        // 1. Allow Login/Auth/Static/Admin-API Routes ALWAYS
        if (req.originalUrl.startsWith('/api/login') ||
            req.originalUrl.startsWith('/api/auth') ||
            req.originalUrl.startsWith('/api/register') ||
            req.originalUrl.startsWith('/api/static') ||
            req.originalUrl.startsWith('/api/upload') ||
            req.originalUrl.startsWith('/api/uploads') ||
            req.method === 'OPTIONS'
        ) {
            return next();
        }

        // 2. Check Global Settings
        const settings = await SystemSettings.findById('global_settings');
        if (!settings || !settings.maintenanceMode) {
            return next();
        }

        // 3. Maintenance is ON -> Check for Bypass Authorization (JWT)
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findById(decoded.id).select('role permissions');

                if (user && user.role === 'admin') {
                    req.user = user;
                    return next(); // ONLY Admin can bypass maintenance
                }
            } catch (err) {
                // Token invalid or expired - treat as anonymous
                console.log('Maintenance Bypass Failed: Invalid Token');
            }
        }

        // 4. Block Request
        return res.status(503).json({
            error: 'Maintenance Mode',
            message: settings.announcement || 'الموقع تحت الصيانة حالياً، سنعود قريباً!',
            maintenance: true
        });

    } catch (e) {
        logger.error('Maintenance Check Error:', e);
        // Fail Safe: If DB error, maybe allow? Or block?
        // Let's block to be safe if we can't determine state, but usually pass to avoid total outage.
        // Actually, strictly speaking, next() is safer for uptime, but 503 is safer for data integrity.
        // Let's passed next() but log error.
        next();
    }
};

module.exports = checkMaintenance;

