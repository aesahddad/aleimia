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

        // "Radical Honesty": Regex is slow on large DBs. We now use Text Indexes.
        const textSearchQuery = { $text: { $search: query }, status: 'active' };
        
        let stores = await Store.find(textSearchQuery).select('name imageUrl _id').limit(10);
        
        // If no text match, fallback to regex for partial matches (better for small queries)
        if (stores.length === 0) {
            const regex = new RegExp(query, 'i');
            stores = await Store.find({
                status: 'active',
                $or: [{ name: regex }, { category: regex }]
            }).select('name imageUrl _id').limit(10);
        }

        const activeStoreIds = stores.map(s => s._id);

        let products = await Product.find({
            $text: { $search: query },
            storeId: { $in: activeStoreIds }
        }).select('name imageUrl storeId _id price').limit(10);

        if (products.length === 0) {
            const regex = new RegExp(query, 'i');
            products = await Product.find({
                name: regex,
                storeId: { $in: activeStoreIds }
            }).select('name imageUrl storeId _id price').limit(10);
        }

        return { stores, products };
    }
}

module.exports = new SearchService();
