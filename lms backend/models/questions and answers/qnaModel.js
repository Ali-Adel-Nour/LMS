const mongoose = require("mongoose");

const qnaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question is required"],
      index: true,
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      required: [true, "Answer is required"],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Additional metadata
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    // Ratings by community
    communityRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    // Views specific to this QnA pair
    pairViewCount: {
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

// Indexes for optimal performance
qnaSchema.index({ user: 1, createdAt: -1 });
qnaSchema.index({ question: 1, answer: 1 });
qnaSchema.index({ featured: 1, communityRating: -1 });
qnaSchema.index({ course: 1, featured: 1 });

// Compound index for efficient queries
qnaSchema.index({ featured: 1, createdAt: -1 });

// Pre-save: Validate question and answer exist
qnaSchema.pre("save", async function (next) {
  try {
    const Question = mongoose.model("Question");
    const Answer = mongoose.model("Answer");

    const question = await Question.findById(this.question);
    const answer = await Answer.findById(this.answer);

    if (!question) {
      return next(new Error("Referenced question does not exist"));
    }

    if (!answer) {
      return next(new Error("Referenced answer does not exist"));
    }

    // Ensure answer belongs to the question
    if (answer.question.toString() !== this.question.toString()) {
      return next(new Error("Answer does not belong to the specified question"));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Virtual: Quality score (combining various metrics)
qnaSchema.virtual("qualityScore").get(function () {
  // This can be extended with more complex scoring logic
  return this.communityRating * 20 + this.pairViewCount * 0.1;
});

// Method: Increment view count
qnaSchema.methods.incrementViews = async function () {
  this.pairViewCount += 1;
  return this.save();
};

// Method: Update community rating
qnaSchema.methods.updateCommunityRating = async function (newRating) {
  if (newRating < 0 || newRating > 5) {
    throw new Error("Rating must be between 0 and 5");
  }
  this.communityRating = newRating;
  return this.save();
};

// Method: Feature this QnA pair
qnaSchema.methods.feature = async function () {
  this.featured = true;
  return this.save();
};

// Method: Unfeature this QnA pair
qnaSchema.methods.unfeature = async function () {
  this.featured = false;
  return this.save();
};

// Static: Get featured QnA pairs
qnaSchema.statics.getFeatured = function (courseId = null, limit = 10) {
  const query = { featured: true };
  if (courseId) {
    query.course = courseId;
  }

  return this.find(query)
    .sort({ communityRating: -1, createdAt: -1 })
    .limit(limit)
    .populate("question", "title description")
    .populate("answer", "content")
    .populate("user", "firstname lastname user_image");
};

// Static: Get best QnA pairs
qnaSchema.statics.getBest = function (courseId = null, limit = 10) {
  const query = {};
  if (courseId) {
    query.course = courseId;
  }

  return this.find(query)
    .sort({ communityRating: -1, pairViewCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("question", "title description author")
    .populate("answer", "content author")
    .populate("user", "firstname lastname user_image");
};

// Static: Get trending QnA pairs
qnaSchema.statics.getTrending = function (courseId = null, days = 7, limit = 10) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = { createdAt: { $gte: since } };
  if (courseId) {
    query.course = courseId;
  }

  return this.find(query)
    .sort({ pairViewCount: -1, communityRating: -1 })
    .limit(limit)
    .populate("question", "title description")
    .populate("answer", "content")
    .populate("user", "firstname lastname user_image");
};

// Static: Get user's QnA contributions
qnaSchema.statics.getUserContributions = function (userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("question", "title")
    .populate("answer", "content")
    .populate("course", "title");
};

// Post-save: Update question metrics if this is an accepted answer
qnaSchema.post("save", async function (doc) {
  try {
    const Question = mongoose.model("Question");
    const question = await Question.findById(doc.question);

    if (question && !question.acceptedAnswerId) {
      // Auto-accept first featured answer (optional business logic)
      // This can be customized based on your requirements
    }
  } catch (error) {
    console.error("Error in QnA post-save hook:", error);
  }
});

module.exports = mongoose.model("QNA", qnaSchema);
