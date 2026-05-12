const Joi = require('joi');
const { error: sendError } = require('../utils/response');

const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[source], {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const details = error.details.map(d => d.message).join(', ');
            return sendError(res, details, 400);
        }

        next();
    };
};

// --- Auth Schemas ---
const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('customer', 'merchant', 'admin')
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// --- Store Schemas ---
const storeSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().required(),
    description: Joi.string().allow('', null),
    whatsapp: Joi.string().allow('', null),
    whatsappNumber: Joi.string().allow('', null),
    logoUrl: Joi.string().allow('', null),
    coverUrl: Joi.string().allow('', null),
    promoVideo: Joi.string().allow('', null),
    branding: Joi.object().allow(null),
    theme: Joi.object().allow(null)
});

// --- Ad Schemas ---
const adSchema = Joi.object({
    title: Joi.string().min(5).max(150).required(),
    description: Joi.string().required(),
    category: Joi.string().valid('haraj', 'estate', 'other').required(),
    price: Joi.number().min(0).required(),
    contactNumber: Joi.string().required(),
    videoUrl: Joi.string().allow('', null),
    imageUrl: Joi.string().allow('', null),
    images: Joi.array().items(Joi.string()).allow(null),
    location: Joi.string().allow('', null),
    whatsappLink: Joi.string().allow('', null)
});

// --- Product Schemas ---
const productSchema = Joi.object({
    name: Joi.string().min(2).max(150).required(),
    price: Joi.number().min(0),
    description: Joi.string().allow('', null),
    displayMode: Joi.string().valid('', 'frame', 'model'),
    imageUrl: Joi.string().allow('', null),
    modelUrl: Joi.string().allow('', null),
    videoUrl: Joi.string().allow('', null),
    category: Joi.string().allow('', null),
    specs: Joi.any(),
    galleryImages: Joi.any(),
    reviews: Joi.any()
});

const refreshSchema = Joi.object({
    refreshToken: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
});

const reviewSchema = Joi.object({
    user: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().allow('', null)
});

const storeUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(100),
    category: Joi.string(),
    description: Joi.string().allow('', null),
    whatsapp: Joi.string().allow('', null),
    whatsappNumber: Joi.string().allow('', null),
    logoUrl: Joi.string().allow('', null),
    coverUrl: Joi.string().allow('', null),
    promoVideo: Joi.string().allow('', null),
    branding: Joi.object().allow(null),
    theme: Joi.object().allow(null),
    imageUrl: Joi.string().allow('', null),
    websiteUrl: Joi.string().allow('', null),
    aboutUs: Joi.string().allow('', null),
    financial: Joi.object().allow(null)
});

const settingsUpdateSchema = Joi.object({
    siteName: Joi.string(),
    siteDescription: Joi.string(),
    maintenanceMode: Joi.boolean(),
    maintenanceMessage: Joi.string().allow('', null),
    adsEnabled: Joi.boolean(),
    defaultPlan: Joi.string(),
    registrationOpen: Joi.boolean(),
    socialLinks: Joi.object().allow(null),
    contactEmail: Joi.string().email().allow('', null),
    contactPhone: Joi.string().allow('', null),
    primaryColor: Joi.string().allow('', null),
    logo: Joi.string().allow('', null),
    favicon: Joi.string().allow('', null)
});

const paymentInitSchema = Joi.object({
    planId: Joi.string().required(),
    storeId: Joi.string().required()
});

const paymentCartSchema = Joi.object({
    cartItems: Joi.array().items(Joi.object({
        storeId: Joi.string().required(),
        items: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            quantity: Joi.number().min(1).required(),
            productId: Joi.string()
        })).min(1)
    })).min(1)
});

const registerSupplierSchema = Joi.object({
    storeId: Joi.string().required(),
    supplierCode: Joi.string().allow('', null)
});

const subscriptionCreateSchema = Joi.object({
    storeId: Joi.string().required(),
    planId: Joi.string().required(),
    paymentRef: Joi.string().allow('', null)
});

const subscriptionPlanSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    duration: Joi.string().valid('monthly', 'yearly').required(),
    description: Joi.string().allow('', null),
    features: Joi.array().items(Joi.string()).allow(null)
});

const tabsSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().allow('', null),
    page: Joi.string().required(),
    order: Joi.number().min(0)
});

const memberAddSchema = Joi.object({
    email: Joi.string().email().required()
});

const userUpdateSchema = Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    role: Joi.string().valid('customer', 'merchant', 'admin'),
    status: Joi.string().valid('active', 'banned', 'inactive'),
    permissions: Joi.object().allow(null)
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    refreshSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    storeSchema,
    storeUpdateSchema,
    adSchema,
    productSchema,
    reviewSchema,
    settingsUpdateSchema,
    paymentInitSchema,
    paymentCartSchema,
    registerSupplierSchema,
    subscriptionCreateSchema,
    subscriptionPlanSchema,
    tabsSchema,
    memberAddSchema,
    userUpdateSchema
};
