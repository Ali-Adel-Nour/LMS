const mongoose = require('mongoose');

let newsLetterSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
  }
}, {
  timestamps: true,
})

module.exports = mongoose.model('NewsLetter', newsLetterSchema)