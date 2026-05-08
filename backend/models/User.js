const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'merchant', 'admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },

    // Store Relationship (For Merchants)
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },

    // Admin Permissions (Granular)
    permissions: {
        stores: {
            manage: { type: Boolean, default: false }, // Allows view & basic edit
            simulate: { type: Boolean, default: false },
            activate: { type: Boolean, default: false }, // Approve/Activate
            freeze: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        ads: {
            manage: { type: Boolean, default: false },
            approve: { type: Boolean, default: false },
            reject: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        ops: {
            manage: { type: Boolean, default: false },
            tickets: { type: Boolean, default: false },
            refunds: { type: Boolean, default: false }
        },
        moderation: {
            manage: { type: Boolean, default: false },
            content_review: { type: Boolean, default: false },
            ban_users: { type: Boolean, default: false }
        },
        users: {
            manage: { type: Boolean, default: false },
            edit_roles: { type: Boolean, default: false } // Dangerous!
        }
    }

}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Encrypt password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
