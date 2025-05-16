// const mongoose = require('mongoose');


// const connection = mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB successfully!'))
//   .catch((error) => console.error('Error connecting to MongoDB:', error));


// module.exports = connection


const mongoose = require('mongoose');

// Increase EventEmitter max listeners to prevent warnings
require('events').EventEmitter.defaultMaxListeners = 15;

// Connection options following best practices
const options = {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10 // Maintain up to 10 socket connections
};

// Create a connection function
const dbConnect = async () => {
  try {
    if (mongoose.connection.readyState === 0) { // Check if not connected
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('Connected to MongoDB successfully!');
    }
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

// Handle connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// Clean up resources when the Node process ends
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

module.exports = dbConnect;


/*
const dbConnect = ()=>{
  try{
    const connection = mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB successfully')
  }catch(error){
    console.error('Error connecting to MongoDB:', error)
  }
}

module.exports = dbConnect
*/