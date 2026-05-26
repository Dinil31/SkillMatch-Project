const Message = require('../models/Message');
const User = require('../models/User');

/**
 * @desc    Send a message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    let { receiverId, message, messageType = 'text', quotationDetails } = req.body;

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    const conversationId = Message.generateConversationId(req.user._id, receiverId);

    const messageData = {
      senderId: req.user._id,
      receiverId,
      conversationId,
      messageType,
    };

    if (req.file) {
      console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size);
      const { uploadToCloudinary } = require('../config/cloudinary');
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'skillmatchlk/messages');
        console.log('Cloudinary upload success:', result.secure_url);
        messageData.fileUrl = result.secure_url;
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        throw err;
      }
      
      // Auto-determine type if not provided explicitly
      if (req.file.mimetype.startsWith('image/')) {
        messageData.messageType = 'image';
      } else if (req.file.mimetype === 'application/pdf') {
        messageData.messageType = 'file';
      }

      // If no text message is provided with the file, set a default
      if (!message || message.trim() === '') {
        messageData.message = messageData.messageType === 'image' ? 'Sent an image' : 'Sent a document';
      } else {
        messageData.message = message;
      }
    } else {
      console.log('No req.file found! req.body:', req.body);
      messageData.message = message || '';
    }

    if (messageData.messageType === 'quotation' && quotationDetails) {
      // Handle potential stringified JSON from FormData
      if (typeof quotationDetails === 'string') {
        try {
          messageData.quotationDetails = JSON.parse(quotationDetails);
        } catch (e) {
          messageData.quotationDetails = quotationDetails;
        }
      } else {
        messageData.quotationDetails = quotationDetails;
      }
    }

    console.log('Creating message with data:', messageData);
    const newMessage = await Message.create(messageData);

    await newMessage.populate([
      { path: 'senderId', select: 'name profileImage' },
      { path: 'receiverId', select: 'name profileImage' },
    ]);

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive_message', newMessage);
      io.to(receiverId.toString()).emit('new_message_notification', {
        from: req.user.name,
        message: messageData.message.substring(0, 50),
        conversationId,
      });
    }

    // Send notification if it's a quotation
    if (messageData.messageType === 'quotation') {
      const { sendNotification } = require('../utils/notificationUtil');
      await sendNotification(
        io,
        receiverId,
        'job_request',
        'New Quotation Received',
        `${req.user.name} has sent you a quotation for LKR ${messageData.quotationDetails.budget}.`,
        `/messages?recipientId=${req.user._id}`,
        { conversationId, quotationId: newMessage._id }
      );
    }

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    // Return detailed error directly to client for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Detailed Error: ' + (error.message || error.toString() || 'Unknown error'),
      stack: error.stack
    });
  }
};

/**
 * @desc    Get messages in a conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
const getConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of this conversation
    const userId = req.user._id.toString();
    const ids = conversationId.split('_');
    if (!ids.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId, deletedBy: { $ne: req.user._id } })
        .populate('senderId', 'name profileImage')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversationId, deletedBy: { $ne: req.user._id } }),
    ]);

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      messages: messages.reverse(), // Return in chronological order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get the latest message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ senderId: userId }, { receiverId: userId }] },
            { deletedBy: { $ne: userId } }
          ]
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate user info for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.senderId.toString() === userId.toString()
          ? conv.lastMessage.receiverId
          : conv.lastMessage.senderId;

        const otherUser = await User.findById(otherUserId).select('name profileImage');

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage.message,
          lastMessageTime: conv.lastMessage.createdAt,
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.json({ success: true, conversations: populatedConversations });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a message as read
 * @route   PUT /api/messages/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quotation status
 * @route   PUT /api/messages/:id/quotation-status
 * @access  Private
 */
const updateQuotationStatus = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.messageType !== 'quotation') {
      return res.status(400).json({ success: false, message: 'Not a quotation message' });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    message.quotationDetails.status = status;
    await message.save();

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('quotation_updated', message);
    }

    res.json({ success: true, message: `Quotation ${status}` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear a conversation
 * @route   DELETE /api/messages/:conversationId
 * @access  Private
 */
const clearConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedBy: req.user._id } }
    );
    res.json({ success: true, message: 'Chat cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getConversation, getConversations, markAsRead, updateQuotationStatus, clearConversation };
