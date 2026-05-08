const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'محاولات كثيرة جداً. الرجاء المحاولة بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = rateLimiter;