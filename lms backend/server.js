const http = require('http');


const app = require('./app');

const { connectRedis } = require('./config/redisConfig');


const PORT = process.env.PORT || 5000


const server = http.createServer(app)


const startServer = async () => {
  try {
      // Connect to Redis first
      await connectRedis();

      // Then start the server
      app.listen(PORT, () => {
          console.log(`Server is Running on port ${PORT}`);
      });
  } catch (error) {
      console.error('Server startup failed:', error);
      process.exit(1);
  }
};

startServer();