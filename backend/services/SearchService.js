const Store = require('../models/Store');
const Product = require('../models/Product');

/**
 * @class SearchService
 * @description المسؤول عن منطق البحث في القلعة.
 */
class SearchService {
    /**
     * تنفيذ بحث عالمي في المتاجر والمنتجات
     * @param {string} query 
     */
    async globalSearch(query) {
        if (!query) return { stores: [], products: [] };

        const regex = new RegExp(query, 'i');

        // جلب المتاجر النشطة فقط
        const activeStores = await Store.find({ status: 'active' }, '_id');
        const activeStoreIds = activeStores.map(s => s._id);

        const [stores, products] = await Promise.all([
            Store.find({
                status: 'active',
                $or: [{ name: regex }, { category: regex }]
            }).select('name imageUrl _id'),
            Product.find({
                name: regex,
                storeId: { $in: activeStoreIds }
            }).select('name imageUrl storeId _id price')
        ]);

        return { stores, products };
    }
}

module.exports = new SearchService();
