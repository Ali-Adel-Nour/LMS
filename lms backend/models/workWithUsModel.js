const mongoose = require('mongoose');

const workWithUsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  resume: {
    type: String, // URL to uploaded resume
  },
  coverLetter: {
    type: String,
    required: true,
  },
  portfolio: {
    type: String, // URL to portfolio
  },
  expectedSalary: {
    type: Number,
  },
  availableFrom: {
    type: Date,
  },
  skills: [{
    type: String,
  }],
  education: {
    degree: String,
    institution: String,
    year: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String, // Admin notes
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Work', workWithUsSchema);