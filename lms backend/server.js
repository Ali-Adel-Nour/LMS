const http = require('http');


const app = require('./app');

const { connectRedis } = require('./config/redisConfig');

const dbConnect = require('./config/dbConfig');

const PORT = process.env.PORT || 5000

const server = http.createServer(app)
const startServer = async () => {
  try {
    // Connect to database
    await dbConnect();

    // Connect to Redis if needed
    await connectRedis();

    // Start server with the http server instance
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};
startServer();