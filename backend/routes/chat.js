const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');
const { protect } = require('../middleware/auth');

router.get('/:adId', protect, (req, res) => ChatController.getMessages(req, res));
router.put('/:adId/read', protect, (req, res) => ChatController.markRead(req, res));

module.exports = router;
