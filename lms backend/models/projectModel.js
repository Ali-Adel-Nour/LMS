const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    link: [
      {
        name: String,
        url: String,
      },
    ],
    images: [{ type: String }],
    author: {
      type: String,
      default: "Ali Adel",
    },
    price: {
      type: Number,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    techStack: [
      {
        type: String,
      },
    ],
    keywords: [],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);