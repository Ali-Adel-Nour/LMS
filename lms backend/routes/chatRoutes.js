const express = require('express');
const {
    getOrCreateConversation,
    getMyConversations,
    sendMessage,
    getMessages,
    editMessage,
    deleteMessage,
    getUserStatus,
    getUnreadCount,
    deleteConversation
} = require('../controllers/chatCtrl');
const { authMiddleware } = require('../middleware/authMiddleware');

const chatRouter = express.Router();

// All routes require authentication
chatRouter.use(authMiddleware);

// Conversation routes
chatRouter.get('/conversations', getMyConversations);
chatRouter.get('/conversations/user/:recipientId', getOrCreateConversation);
chatRouter.delete('/conversations/:conversationId', deleteConversation);

// Message routes
chatRouter.post('/conversations/:conversationId/messages', sendMessage);
chatRouter.get('/conversations/:conversationId/messages', getMessages);
chatRouter.put('/messages/:messageId', editMessage);
chatRouter.delete('/messages/:messageId', deleteMessage);

// Status routes
chatRouter.get('/users/:userId/status', getUserStatus);
chatRouter.get('/unread-count', getUnreadCount);

module.exports = chatRouter;
