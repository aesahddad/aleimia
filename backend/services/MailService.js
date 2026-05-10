const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    return transporter;
}

async function sendPasswordReset(email, resetToken) {
    const from = process.env.SMTP_FROM || 'noreply@aleinia.com';
    const domain = process.env.DOMAIN || 'aleinia.com';
    const resetUrl = `${process.env.FRONTEND_URL || `https://${domain}`}/auth?mode=reset&token=${resetToken}`;

    const html = `
        <div dir="rtl" style="font-family: 'Tahoma', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #1e3a8a; font-size: 24px; margin: 0;">تعيين كلمة المرور</h1>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px;">
                <p style="font-size: 14px; line-height: 1.7; color: #1e293b;">مرحباً،</p>
                <p style="font-size: 14px; line-height: 1.7; color: #1e293b;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. يمكنك إعادة تعيينها بالضغط على الزر أدناه:</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">إعادة تعيين كلمة المرور</a>
                </div>
                <p style="font-size: 12px; color: #64748b; line-height: 1.6;">إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة. الرابط صالح لمدة ساعة واحدة.</p>
            </div>
            <div style="text-align: center; margin-top: 16px;">
                <p style="font-size: 11px; color: #94a3b8;">© ${new Date().getFullYear()} متجر الينية. جميع الحقوق محفوظة.</p>
            </div>
        </div>
    `;

    const info = await getTransporter().sendMail({
        from: `"متجر الينية" <${from}>`,
        to: email,
        subject: 'إعادة تعيين كلمة المرور',
        html
    });

    return info;
}

module.exports = { sendPasswordReset };
