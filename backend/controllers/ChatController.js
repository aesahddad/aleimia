const ChatMessage = require('../models/ChatMessage');

class ChatController {
    static async getMessages(req, res) {
        try {
            const { adId } = req.params;
            const messages = await ChatMessage.find({ adId }).sort({ createdAt: 1 }).limit(100);
            res.json(messages);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async markRead(req, res) {
        try {
            const { adId } = req.params;
            await ChatMessage.updateMany({ adId, read: false }, { read: true });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = ChatController;
