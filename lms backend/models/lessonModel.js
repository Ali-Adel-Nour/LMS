const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: [3, "Title must be at least 3 characters long"],
      maxLength: [360, "Title must be at most 360 characters long"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },

    content: {
      type: String,
      minLength: [200, "Content must be at least 100 characters long"],
    },
    video: {
      type: String,

    },
    freePreview: {
      type: Boolean,
      default: false,
    },
  },
);

module.exports = mongoose.model("Lesson", lessonSchema);
