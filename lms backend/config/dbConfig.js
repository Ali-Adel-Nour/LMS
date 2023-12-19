const mongoose = require('mongoose');


const connection = mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB successfully!'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));


module.exports = connection