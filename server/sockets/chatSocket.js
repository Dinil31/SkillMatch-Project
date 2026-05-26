// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

/**
 * Initialize Socket.IO event handlers
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user_online', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;

        // Join personal room for notifications
        socket.join(userId);

        // Broadcast updated online users list
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log(`👤 User ${userId} is online`);
      }
    });

    // Join a conversation room
    socket.on('join_room', (conversationId) => {
      socket.join(conversationId);
      console.log(`📬 Socket ${socket.id} joined room: ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_room', (conversationId) => {
      socket.leave(conversationId);
      console.log(`📤 Socket ${socket.id} left room: ${conversationId}`);
    });

    // Send a message
    socket.on('send_message', (data) => {
      const { conversationId, message, senderId, receiverId } = data;

      if (!conversationId || !message) return;

      // Broadcast to everyone in the conversation room (including sender)
      io.to(conversationId).emit('receive_message', {
        ...data,
        timestamp: new Date(),
      });

      // Notify receiver if they're not in the room
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverId).emit('new_message_notification', {
          from: senderId,
          message: message.substring(0, 50),
          conversationId,
        });
      }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      socket.to(conversationId).emit('typing', { userId, isTyping });
    });

    // Mark messages as read
    socket.on('messages_read', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('messages_read', { userId });
    });

    // Get online users
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users', Array.from(onlineUsers.keys()));
        io.emit('user_offline', socket.userId);
        console.log(`❌ User ${socket.userId} disconnected`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
};

module.exports = { initSocket, onlineUsers };
