const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { getRedisClient } = require('./redisConfig');

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:4000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || 
                          socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.user._id} (${socket.user.firstname})`);

        // Join user to their personal room
        socket.join(socket.user._id.toString());

        // Set user as online in Redis
        await setUserOnline(socket.user._id);

        // Broadcast online status
        socket.broadcast.emit('user:online', {
            userId: socket.user._id,
            timestamp: new Date()
        });

        // Handle joining conversation rooms
        socket.on('conversation:join', (conversationId) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${socket.user._id} joined conversation ${conversationId}`);
        });

        // Handle leaving conversation rooms
        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Handle typing indicator
        socket.on('typing:start', async (data) => {
            const { conversationId } = data;
            
            try {
                // Store typing status in Redis (expires in 5 seconds)
                const client = await getRedisClient();
                await client.setEx(
                    `typing:${conversationId}:${socket.user._id}`,
                    5,
                    'true'
                );

                socket.to(`conversation:${conversationId}`).emit('typing:update', {
                    conversationId,
                    userId: socket.user._id,
                    userName: `${socket.user.firstname} ${socket.user.lastname}`,
                    isTyping: true
                });
            } catch (error) {
                console.error('Typing start error:', error);
            }
        });

        socket.on('typing:stop', async (data) => {
            const { conversationId } = data;
            
            try {
                const client = await getRedisClient();
                await client.del(`typing:${conversationId}:${socket.user._id}`);

                socket.to(`conversation:${conversationId}`).emit('typing:update', {
                    conversationId,
                    userId: socket.user._id,
                    isTyping: false
                });
            } catch (error) {
                console.error('Typing stop error:', error);
            }
        });

        // Handle message read
        socket.on('message:read', async (data) => {
            const { conversationId, messageIds } = data;
            
            socket.to(`conversation:${conversationId}`).emit('message:read:update', {
                conversationId,
                messageIds,
                readBy: socket.user._id,
                readAt: new Date()
            });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.user._id}`);
            
            await setUserOffline(socket.user._id);

            socket.broadcast.emit('user:offline', {
                userId: socket.user._id,
                timestamp: new Date()
            });
        });
    });

    return io;
};

// Helper functions for online status
const setUserOnline = async (userId) => {
    try {
        const client = await getRedisClient();
        await client.hSet('online_users', userId.toString(), JSON.stringify({
            status: 'online',
            lastSeen: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error setting user online:', error);
    }
};

const setUserOffline = async (userId) => {
    try {
        const client = await getRedisClient();
        await client.hSet('online_users', userId.toString(), JSON.stringify({
            status: 'offline',
            lastSeen: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error setting user offline:', error);
    }
};

const getUserOnlineStatus = async (userId) => {
    try {
        const client = await getRedisClient();
        const data = await client.hGet('online_users', userId.toString());
        return data ? JSON.parse(data) : { status: 'offline', lastSeen: null };
    } catch (error) {
        console.error('Error getting user status:', error);
        return { status: 'offline', lastSeen: null };
    }
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO,
    setUserOnline,
    setUserOffline,
    getUserOnlineStatus
};
