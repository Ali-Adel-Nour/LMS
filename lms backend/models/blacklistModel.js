const mongoose = require('mongoose');


const blacklistSchema = new mongoose.Schema(
  {
      token: {
          type: String,
          required: true,
          ref: "User",
      },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Blacklist", blacklistSchema);