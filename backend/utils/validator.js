/**
 * @namespace Validator
 * @description Simple validation utilities for the Aleinia backend.
 */
class Validator {
    /**
     * Validate common store fields
     * @param {object} data 
     */
    static validateStore(data) {
        const errors = [];
        if (!data.name || data.name.length < 3) errors.push('اسم المتجر قصير جداً');
        if (!data.category) errors.push('التصنيف مطلوب');
        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate common ad fields
     * @param {object} data 
     */
    static validateAd(data) {
        const errors = [];
        if (!data.title || data.title.length < 5) errors.push('العنوان قصير جداً');
        if (!data.category) errors.push('التصنيف مطلوب');
        if (data.price && isNaN(data.price)) errors.push('السعر يجب أن يكون رقماً');
        return { isValid: errors.length === 0, errors };
    }
}

module.exports = Validator;
