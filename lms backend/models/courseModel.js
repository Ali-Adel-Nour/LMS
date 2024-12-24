const mongoose = require('mongoose');

let courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
      default:
        "https://climate.onep.go.th/mp-content/uploads/2020/01/default-image.jpg",
    },
    video: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      minLength: [10, "Description must be at least 10 characters long"],
      maxLength: [1000, "Description must be at most 1000 characters long"],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },

    published: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    }],
    paid:{
      type: Boolean,
      default: false,
    },
    totalHours: {
      type: Number,
      required: true,
      default: 0,
    },
    enrolled: {
      type: String,
      required: true,
      default: 0,
    },

    rating:[{
      stars: {
        type: Number,
        required: true,
        default: 0,
      },
      comment: {
        type: String,
        postedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      },
      totalRating: {
        type: Number,
        required: true,
        default: 0,
      }
    }],

    keywords: {
      type: [],
      required: true,
    }
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('Course', courseSchema);