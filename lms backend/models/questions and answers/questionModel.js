const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Question title is required"],
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Question description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Question author is required"],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        minlength: [2, "Tag must be at least 2 characters"],
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "closed", "resolved", "archived"],
        message: "Invalid status: must be draft, published, closed, resolved, or archived",
      },
      default: "published",
      index: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Invalid difficulty: must be beginner, intermediate, or advanced",
      },
      default: "beginner",
    },
    category: {
      type: String,
      enum: {
        values: ["technical", "conceptual", "homework", "project", "general"],
        message: "Invalid category",
      },
      default: "general",
      index: true,
    },
    // Engagement metrics
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
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
    answerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      default: null,
    },
    // Reputation and tracking
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBounty: {
      type: Boolean,
      default: false,
    },
    bountyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Voting tracking
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
    // SEO and analytics
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for optimal query performance
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ course: 1, status: 1, createdAt: -1 });
questionSchema.index({ tags: 1, status: 1 });
questionSchema.index({ featured: 1, createdAt: -1 });
questionSchema.index({ isResolved: 1, createdAt: -1 });
questionSchema.index({ title: "text", description: "text" });

// Virtual for rating
questionSchema.virtual("rating").get(function () {
  return this.upvotes - this.downvotes;
});

// Middle-ware: Update view count
questionSchema.methods.addView = async function (userId = null) {
  this.viewCount += 1;
  if (userId) {
    this.views.push({ userId, viewedAt: new Date() });
  }
  return this.save();
};

// Method: Add upvote
questionSchema.methods.upvote = async function (userId) {
  const existingVote = this.votedBy.find((v) => v.user.toString() === userId.toString());

  if (existingVote) {
    if (existingVote.voteType === "upvote") {
      // Remove upvote
      this.votedBy = this.votedBy.filter((v) => v.user.toString() !== userId.toString());
      this.upvotes = Math.max(0, this.upvotes - 1);
    } else {
      // Change downvote to upvote
      existingVote.voteType = "upvote";
      this.downvotes = Math.max(0, this.downvotes - 1);
      this.upvotes += 1;
    }
  } else {
    // Add new upvote
    this.votedBy.push({ user: userId, voteType: "upvote" });
    this.upvotes += 1;
  }

  return this.save();
};

// Method: Add downvote
questionSchema.methods.downvote = async function (userId) {
  const existingVote = this.votedBy.find((v) => v.user.toString() === userId.toString());

  if (existingVote) {
    if (existingVote.voteType === "downvote") {
      // Remove downvote
      this.votedBy = this.votedBy.filter((v) => v.user.toString() !== userId.toString());
      this.downvotes = Math.max(0, this.downvotes - 1);
    } else {
      // Change upvote to downvote
      existingVote.voteType = "downvote";
      this.upvotes = Math.max(0, this.upvotes - 1);
      this.downvotes += 1;
    }
  } else {
    // Add new downvote
    this.votedBy.push({ user: userId, voteType: "downvote" });
    this.downvotes += 1;
  }

  return this.save();
};

// Method: Mark as resolved
questionSchema.methods.markResolved = async function (answerId) {
  this.acceptedAnswerId = answerId;
  this.isResolved = true;
  this.resolvedAt = new Date();
  this.status = "resolved";
  return this.save();
};

// Static method: Find trending questions
questionSchema.statics.getTrending = function (limit = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.find({
    status: "published",
    createdAt: { $gte: sevenDaysAgo },
  })
    .sort({ viewCount: -1, upvotes: -1 })
    .limit(limit)
    .populate("author", "firstname lastname user_image")
    .populate("course", "title");
};

// Static method: Find unanswered questions
questionSchema.statics.getUnanswered = function (filter = {}) {
  return this.find({
    status: "published",
    answerCount: 0,
    ...filter,
  })
    .sort({ createdAt: -1 })
    .populate("author", "firstname lastname user_image")
    .populate("course", "title");
};

// Pre-save validation
questionSchema.pre("save", function (next) {
  // Ensure viewCount is never negative
  if (this.viewCount < 0) this.viewCount = 0;
  if (this.upvotes < 0) this.upvotes = 0;
  if (this.downvotes < 0) this.downvotes = 0;
  if (this.answerCount < 0) this.answerCount = 0;

  next();
});

module.exports = mongoose.model("Question", questionSchema);
