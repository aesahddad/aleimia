require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Ad = require('./models/Ad');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for seeding...');

    const email = 'admin@aleinia.com';
    let admin = await User.findOne({ email });
    if (admin) {
        admin.role = 'admin';
        admin.password = 'admin123';
        admin.permissions = {
            stores: { manage: true, delete: true, freeze: true, activate: true, simulate: true },
            ads: { manage: true, approve: true, reject: true, delete: true },
            users: { manage: true, edit_roles: true },
            moderation: { manage: true, ban_users: true },
            ops: { manage: true }
        };
        await admin.save();
        console.log('Admin updated.');
    } else {
        admin = await User.create({
            username: 'Super Admin', email, password: 'admin123', role: 'admin',
            permissions: { stores: { manage: true, delete: true, freeze: true, activate: true, simulate: true }, ads: { manage: true, approve: true, reject: true, delete: true }, users: { manage: true, edit_roles: true }, moderation: { manage: true, ban_users: true }, ops: { manage: true } }
        });
        console.log('Admin created.');
    }

    const stores = [
        { name: 'عطور النخبة', category: 'perfumes', slug: 'elite-perfumes', ownerId: admin._id, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500' },
        { name: 'عقارات الرياض', category: 'estate', slug: 'riyadh-estate', ownerId: admin._id, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500' }
    ];
    for (const s of stores) {
        await Store.findOneAndUpdate({ slug: s.slug }, s, { upsert: true });
    }
    console.log('Stores seeded.');

    const ads = [
        { title: 'تويوتا لاندكروزر 2023', description: 'فل كامل، بحالة الوكالة، ابيض لؤلؤي.', category: 'haraj', price: 320000, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500' },
        { title: 'شقة فاخرة للايجار حي الملقا', description: '4 غرف، مجلس، صالة، مطبخ مجهز.', category: 'estate', price: 65000, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500' }
    ];
    for (const a of ads) {
        await Ad.findOneAndUpdate({ title: a.title }, a, { upsert: true });
    }
    console.log('Ads seeded.');
    console.log(`Admin ready: ${email} / admin123`);

    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
