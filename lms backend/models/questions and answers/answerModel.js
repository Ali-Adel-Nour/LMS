const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Answer content is required"],
      minlength: [10, "Answer must be at least 10 characters"],
      maxlength: [10000, "Answer cannot exceed 10000 characters"],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Answer author is required"],
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "archived"],
        message: "Invalid status: must be pending, approved, rejected, or archived",
      },
      default: "approved",
      index: true,
    },
    // Voting and reputation
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    votedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        voteType: {
          type: String,
          enum: ["upvote", "downvote"],
        },
        _id: false,
      },
    ],
    // Solution tracking
    isAccepted: {
      type: Boolean,
      default: false,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Helpfulness
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        helpful: Boolean,
        _id: false,
      },
    ],
    // Moderation
    flagCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    flaggedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
          enum: ["spam", "inappropriate", "incorrect", "duplicate", "other"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    // Analytics
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
answerSchema.index({ question: 1, isAccepted: -1, createdAt: -1 });
answerSchema.index({ author: 1, createdAt: -1 });
answerSchema.index({ question: 1, status: 1 });
answerSchema.index({ isAccepted: 1 });

// Virtual for rating
answerSchema.virtual("rating").get(function () {
  return this.upvotes - this.downvotes;
});

// Virtual for helpful ratio
answerSchema.virtual("helpfulRatio").get(function () {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? ((this.helpfulCount / total) * 100).toFixed(2) : 0;
});

// Method: Upvote answer
answerSchema.methods.upvote = async function (userId) {
  const existingVote = this.votedBy.find((v) => v.user.toString() === userId.toString());

  if (existingVote) {
    if (existingVote.voteType === "upvote") {
      this.votedBy = this.votedBy.filter((v) => v.user.toString() !== userId.toString());
      this.upvotes = Math.max(0, this.upvotes - 1);
    } else {
      existingVote.voteType = "upvote";
      this.downvotes = Math.max(0, this.downvotes - 1);
      this.upvotes += 1;
    }
  } else {
    this.votedBy.push({ user: userId, voteType: "upvote" });
    this.upvotes += 1;
  }

  return this.save();
};

// Method: Downvote answer
answerSchema.methods.downvote = async function (userId) {
  const existingVote = this.votedBy.find((v) => v.user.toString() === userId.toString());

  if (existingVote) {
    if (existingVote.voteType === "downvote") {
      this.votedBy = this.votedBy.filter((v) => v.user.toString() !== userId.toString());
      this.downvotes = Math.max(0, this.downvotes - 1);
    } else {
      existingVote.voteType = "downvote";
      this.upvotes = Math.max(0, this.upvotes - 1);
      this.downvotes += 1;
    }
  } else {
    this.votedBy.push({ user: userId, voteType: "downvote" });
    this.downvotes += 1;
  }

  return this.save();
};

// Method: Mark as helpful
answerSchema.methods.markHelpful = async function (userId, helpful = true) {
  const existingFeedback = this.helpfulBy.find((h) => h.user.toString() === userId.toString());

  if (existingFeedback) {
    if (existingFeedback.helpful === helpful) {
      // Remove feedback
      this.helpfulBy = this.helpfulBy.filter((h) => h.user.toString() !== userId.toString());
      if (helpful) {
        this.helpfulCount = Math.max(0, this.helpfulCount - 1);
      } else {
        this.notHelpfulCount = Math.max(0, this.notHelpfulCount - 1);
      }
    } else {
      // Switch feedback
      if (existingFeedback.helpful) {
        this.helpfulCount = Math.max(0, this.helpfulCount - 1);
      } else {
        this.notHelpfulCount = Math.max(0, this.notHelpfulCount - 1);
      }
      existingFeedback.helpful = helpful;
      if (helpful) {
        this.helpfulCount += 1;
      } else {
        this.notHelpfulCount += 1;
      }
    }
  } else {
    this.helpfulBy.push({ user: userId, helpful });
    if (helpful) {
      this.helpfulCount += 1;
    } else {
      this.notHelpfulCount += 1;
    }
  }

  return this.save();
};

// Method: Accept answer as solution
answerSchema.methods.acceptAsAnswer = async function (userId) {
  this.isAccepted = true;
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this.save();
};

// Method: Flag answer
answerSchema.methods.flagAnswer = async function (userId, reason = "other") {
  const alreadyFlagged = this.flaggedBy.find((f) => f.user.toString() === userId.toString());

  if (!alreadyFlagged) {
    this.flaggedBy.push({
      user: userId,
      reason,
      timestamp: new Date(),
    });
    this.flagCount += 1;
  }

  if (this.flagCount >= 3) {
    this.isFlagged = true;
  }

  return this.save();
};

// Static: Get best answers for a question
answerSchema.statics.getBestAnswers = function (questionId, limit = 5) {
  return this.find({
    question: questionId,
    status: "approved",
  })
    .sort({ isAccepted: -1, upvotes: -1, helpfulCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "firstname lastname user_image");
};

// Pre-save validation
answerSchema.pre("save", function (next) {
  if (this.upvotes < 0) this.upvotes = 0;
  if (this.downvotes < 0) this.downvotes = 0;
  if (this.helpfulCount < 0) this.helpfulCount = 0;
  if (this.notHelpfulCount < 0) this.notHelpfulCount = 0;
  if (this.flagCount < 0) this.flagCount = 0;

  next();
});

module.exports = mongoose.model("Answer", answerSchema);
