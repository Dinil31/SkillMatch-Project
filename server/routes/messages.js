const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getConversations, markAsRead, updateQuotationStatus, clearConversation } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');

router.post('/', protect, uploadAttachment, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getConversation);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/quotation-status', protect, updateQuotationStatus);
router.delete('/:conversationId', protect, clearConversation);

module.exports = router;
