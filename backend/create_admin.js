require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        // 1. Clean old Admins (Optional, careful in prod)
        // await User.deleteMany({ email: 'admin@aleinia.com' });

        const email = 'admin@aleinia.com';
        const exists = await User.findOne({ email });

        if (exists) {
            console.log('⚠️ Admin already exists. Updating role/permissions...');
            exists.role = 'admin';
            exists.password = 'admin123'; // Force update password
            exists.permissions = {
                stores: { manage: true, delete: true, freeze: true, activate: true, simulate: true },
                ads: { manage: true, approve: true, reject: true, delete: true },
                users: { manage: true },
                moderation: { manage: true }
            };
            await exists.save();
        } else {
            console.log('🆕 Creating new Super Admin...');
            await User.create({
                username: 'Super Admin',
                email: email,
                password: 'admin123', // User requested 'serial'
                role: 'admin',
                permissions: {
                    stores: { manage: true, delete: true, freeze: true, activate: true, simulate: true },
                    ads: { manage: true, approve: true, reject: true, delete: true },
                    users: { manage: true },
                    moderation: { manage: true }
                }
            });
        }

        console.log('🎉 Admin Ready: admin@aleinia.com / admin123');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedAdmin();
