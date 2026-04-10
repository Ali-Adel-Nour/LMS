const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const { getIO, getUserOnlineStatus } = require('../config/socketConfig');
const { client } = require('../config/redisConfig');

// Get or create a conversation with another user
const getOrCreateConversation = asyncHandler(async (req, res) => {
    try {
        const { recipientId } = req.params;
        const { contextType, contextId } = req.query;
        
        validateMongodbId(recipientId);

        // Verify recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                status: false,
                message: 'Recipient not found'
            });
        }

        // Build context object
        const context = {
            type: contextType || 'general'
        };
        
        if (contextId) {
            validateMongodbId(contextId);
            context.referenceId = contextId;
            context.refModel = contextType === 'course' ? 'Course' : 'BookSession';
        }

        const conversation = await Conversation.findOrCreateConversation(
            req.user._id,
            recipientId,
            context
        );

        // Populate participants
        await conversation.populate('participants', 'firstname lastname user_image roles');
        await conversation.populate('lastMessage');

        res.status(200).json({
            status: true,
            message: 'Conversation retrieved successfully',
            conversation
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Get all conversations for the logged-in user
const getMyConversations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        // Check cache first
        const cacheKey = `conversations:${userId}`;
        const cachedData = await client.get(cacheKey);
        
        if (cachedData) {
            return res.status(200).json({
                status: true,
                message: 'Conversations fetched from cache',
                ...JSON.parse(cachedData)
            });
        }

        const conversations = await Conversation.find({
            participants: userId,
            isActive: true
        })
        .populate('participants', 'firstname lastname user_image roles profession')
        .populate({
            path: 'lastMessage',
            select: 'content messageType createdAt sender'
        })
        .sort({ lastMessageAt: -1 });

        // Add online status for each participant
        const conversationsWithStatus = await Promise.all(
            conversations.map(async (conv) => {
                const convObj = conv.toObject();
                
                // Get online status for other participants
                convObj.participants = await Promise.all(
                    convObj.participants.map(async (participant) => {
                        if (participant._id.toString() !== userId.toString()) {
                            const onlineStatus = await getUserOnlineStatus(participant._id);
                            return { ...participant, ...onlineStatus };
                        }
                        return participant;
                    })
                );

                // Get unread count for current user
                const unreadInfo = convObj.unreadCounts.find(
                    u => u.user.toString() === userId.toString()
                );
                convObj.unreadCount = unreadInfo ? unreadInfo.count : 0;

                return convObj;
            })
        );

        // Cache for 5 minutes
        await client.setEx(cacheKey, 300, JSON.stringify({
            count: conversationsWithStatus.length,
            conversations: conversationsWithStatus
        }));

        res.status(200).json({
            status: true,
            message: 'Conversations fetched successfully',
            count: conversationsWithStatus.length,
            conversations: conversationsWithStatus
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, messageType = 'text' } = req.body;
        const senderId = req.user._id;

        validateMongodbId(conversationId);

        // Verify conversation exists and user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderId
        });

        if (!conversation) {
            return res.status(404).json({
                status: false,
                message: 'Conversation not found or access denied'
            });
        }

        // Create the message
        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            content,
            messageType,
            readBy: [{ user: senderId, readAt: new Date() }]
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();

        // Increment unread count for other participants
        conversation.unreadCounts = conversation.unreadCounts.map(uc => {
            if (uc.user.toString() !== senderId.toString()) {
                uc.count += 1;
            }
            return uc;
        });

        await conversation.save();

        // Populate sender info
        await message.populate('sender', 'firstname lastname user_image');

        // Emit to all participants in the conversation room
        try {
            const io = getIO();
            io.to(`conversation:${conversationId}`).emit('message:new', {
                conversationId,
                message
            });

            // Also emit to individual user rooms for notification
            conversation.participants.forEach(participantId => {
                if (participantId.toString() !== senderId.toString()) {
                    io.to(participantId.toString()).emit('notification:message', {
                        conversationId,
                        message,
                        sender: {
                            _id: req.user._id,
                            firstname: req.user.firstname,
                            lastname: req.user.lastname
                        }
                    });
                }
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        // Invalidate cache
        for (const participantId of conversation.participants) {
            await client.del(`conversations:${participantId}`);
        }

        res.status(201).json({
            status: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Get messages for a conversation
const getMessages = asyncHandler(async (req, res) => {
    try {
        const { conversationId } = req.params;
        let { page = 1, limit = 50 } = req.query;
        const userId = req.user._id;

        validateMongodbId(conversationId);

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({
                status: false,
                message: 'Conversation not found or access denied'
            });
        }

        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const totalMessages = await Message.countDocuments({ 
            conversation: conversationId 
        });

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'firstname lastname user_image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Mark messages as read
        const unreadMessages = messages.filter(
            msg => !msg.readBy.some(r => r.user.toString() === userId.toString())
        );

        if (unreadMessages.length > 0) {
            await Message.updateMany(
                {
                    _id: { $in: unreadMessages.map(m => m._id) },
                    'readBy.user': { $ne: userId }
                },
                {
                    $push: { readBy: { user: userId, readAt: new Date() } }
                }
            );

            // Reset unread count for current user
            await Conversation.updateOne(
                { _id: conversationId, 'unreadCounts.user': userId },
                { $set: { 'unreadCounts.$.count': 0 } }
            );

            // Emit read receipt
            try {
                const io = getIO();
                io.to(`conversation:${conversationId}`).emit('message:read:update', {
                    conversationId,
                    messageIds: unreadMessages.map(m => m._id),
                    readBy: userId,
                    readAt: new Date()
                });
            } catch (socketError) {
                console.error('Socket emit error:', socketError);
            }
        }

        res.status(200).json({
            status: true,
            message: 'Messages fetched successfully',
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                hasMore: skip + messages.length < totalMessages
            },
            messages: messages.reverse() // Return in chronological order
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Edit a message
const editMessage = asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        validateMongodbId(messageId);

        const message = await Message.findOne({
            _id: messageId,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({
                status: false,
                message: 'Message not found or you cannot edit this message'
            });
        }

        // Check if message is older than 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt < fifteenMinutesAgo) {
            return res.status(400).json({
                status: false,
                message: 'Cannot edit messages older than 15 minutes'
            });
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        await message.populate('sender', 'firstname lastname user_image');

        // Emit edit event
        try {
            const io = getIO();
            io.to(`conversation:${message.conversation}`).emit('message:edited', {
                conversationId: message.conversation,
                message
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json({
            status: true,
            message: 'Message edited successfully',
            data: message
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Delete a message (soft delete)
const deleteMessage = asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        validateMongodbId(messageId);

        const message = await Message.findOne({
            _id: messageId,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({
                status: false,
                message: 'Message not found or you cannot delete this message'
            });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted';
        await message.save();

        // Emit deletion event
        try {
            const io = getIO();
            io.to(`conversation:${message.conversation}`).emit('message:deleted', {
                conversationId: message.conversation,
                messageId: message._id
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json({
            status: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Get online status of a user
const getUserStatus = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        
        validateMongodbId(userId);

        const status = await getUserOnlineStatus(userId);

        res.status(200).json({
            status: true,
            data: {
                userId,
                ...status
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Get unread message count
const getUnreadCount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            isActive: true
        });

        const totalUnread = conversations.reduce((total, conv) => {
            const userUnread = conv.unreadCounts.find(
                u => u.user.toString() === userId.toString()
            );
            return total + (userUnread ? userUnread.count : 0);
        }, 0);

        res.status(200).json({
            status: true,
            unreadCount: totalUnread
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Delete/Archive a conversation
const deleteConversation = asyncHandler(async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        validateMongodbId(conversationId);

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({
                status: false,
                message: 'Conversation not found or access denied'
            });
        }

        // Soft delete - just mark as inactive
        conversation.isActive = false;
        await conversation.save();

        // Invalidate cache
        for (const participantId of conversation.participants) {
            await client.del(`conversations:${participantId}`);
        }

        res.status(200).json({
            status: true,
            message: 'Conversation archived successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

module.exports = {
    getOrCreateConversation,
    getMyConversations,
    sendMessage,
    getMessages,
    editMessage,
    deleteMessage,
    getUserStatus,
    getUnreadCount,
    deleteConversation
};
