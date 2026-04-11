const mongoose = require("mongoose");
const slugify = require("slugify");

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Tag name must be at least 2 characters"],
      maxlength: [50, "Tag name cannot exceed 50 characters"],
      lowercase: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: {
        values: ["programming", "concept", "tools", "framework", "database", "cloud", "other"],
        message: "Invalid category",
      },
      default: "other",
      index: true,
    },
    // Metadata
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    // Popularity and trending
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    color: {
      type: String,
      default: "#007bff",
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from name
tagSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: "en",
    });
  }
  next();
});

// Indexes
tagSchema.index({ name: 1, isActive: 1 });
tagSchema.index({ usageCount: -1, isActive: 1 });
tagSchema.index({ lastUsedAt: -1 });

// Virtual for trending score
tagSchema.virtual("trendingScore").get(function () {
  const daysSinceUsed = (new Date() - this.lastUsedAt) / (1000 * 60 * 60 * 24);
  return this.usageCount / (1 + daysSinceUsed);
});

// Method: Increment usage
tagSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// Method: Decrement usage
tagSchema.methods.decrementUsage = async function () {
  this.usageCount = Math.max(0, this.usageCount - 1);
  return this.save();
};

// Method: Add question
tagSchema.methods.addQuestion = async function (questionId) {
  if (!this.questionIds.includes(questionId)) {
    this.questionIds.push(questionId);
    await this.incrementUsage();
  }
  return this.save();
};

// Method: Remove question
tagSchema.methods.removeQuestion = async function (questionId) {
  this.questionIds = this.questionIds.filter((id) => id.toString() !== questionId.toString());
  await this.decrementUsage();
  return this.save();
};

// Static: Get trending tags
tagSchema.statics.getTrending = function (limit = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.find({
    isActive: true,
    lastUsedAt: { $gte: sevenDaysAgo },
  })
    .sort({ usageCount: -1, trendingScore: -1 })
    .limit(limit);
};

// Static: Get popular tags
tagSchema.statics.getPopular = function (limit = 10, minUsage = 1) {
  return this.find({
    isActive: true,
    usageCount: { $gte: minUsage },
  })
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Static: Find by name or slug
tagSchema.statics.findByNameOrSlug = function (searchTerm) {
  const slug = slugify(searchTerm, { lower: true, strict: true });
  return this.findOne({
    $or: [
      { name: searchTerm.toLowerCase() },
      { slug },
    ],
    isActive: true,
  });
};

// Static: Create or get tag
tagSchema.statics.createOrGet = async function (tagName) {
  let tag = await this.findByNameOrSlug(tagName);
  if (!tag) {
    tag = await this.create({ name: tagName.trim() });
  }
  return tag;
};

// Pre-delete: Clean up associated questions
tagSchema.pre("deleteOne", async function (next) {
  const tag = this;
  // Optional: Clear tag from questions if using a denormalized structure
  next();
});

module.exports = mongoose.model("Tag", tagSchema);
