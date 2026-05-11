const Joi = require('joi');

/**
 * @description Middleware for validating request data against a Joi schema.
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against.
 * @param {string} source - Where to find the data ('body', 'query', 'params'). Defaults to 'body'.
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[source], {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                error: 'خطأ في التحقق من البيانات',
                details: errorMessage
            });
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
    coverUrl: Joi.string().allow('', null)
});

// --- Ad Schemas ---
const adSchema = Joi.object({
    title: Joi.string().min(5).max(150).required(),
    description: Joi.string().required(),
    category: Joi.string().valid('haraj', 'estate', 'other').required(),
    price: Joi.number().min(0).required(),
    contactNumber: Joi.string().required()
});

// --- Product Schemas ---
const productSchema = Joi.object({
    name: Joi.string().min(2).max(150).required(),
    price: Joi.number().min(0),
    description: Joi.string().allow('', null),
    displayMode: Joi.string().valid('frame', 'model'),
    imageUrl: Joi.string().allow('', null),
    modelUrl: Joi.string().allow('', null),
    videoUrl: Joi.string().allow('', null),
    category: Joi.string().allow('', null),
    specs: Joi.any(),
    galleryImages: Joi.any(),
    reviews: Joi.any()
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    storeSchema,
    adSchema,
    productSchema
};
