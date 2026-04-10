const http = require('http');

const app = require('./app');
const { connectRedis } = require('./config/redisConfig');
const dbConnect = require('./config/dbConfig');
const { initializeSocket } = require('./config/socketConfig');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible in routes if needed
app.set('io', io);

const startServer = async () => {
  try {
    // Connect to database
    await dbConnect();

    // Connect to Redis
    await connectRedis();

    // Start server with the http server instance
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.IO initialized and ready`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();