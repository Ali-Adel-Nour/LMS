const Question = require('../models/questions and answers/questionModel');
const Answer = require('../models/questions and answers/answerModel');
const Tag = require('../models/questions and answers/tagModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const cleaned = tags
    .map((tag) => String(tag).toLowerCase().trim())
    .filter(Boolean);

  return [...new Set(cleaned)];
};

const isOwnerOrAdmin = (resourceUserId, currentUser) => {
  if (!resourceUserId || !currentUser) {
    return false;
  }

  if (resourceUserId.toString() === currentUser._id.toString()) {
    return true;
  }

  return currentUser.roles === 'admin';
};

const createQuestion = asyncHandler(async (req, res) => {
  const authorId = req.user._id;
  validateMongodbId(authorId);

  const tags = normalizeTags(req.body.tags);
  const payload = {
    ...req.body,
    author: authorId,
    tags,
  };

  const question = await Question.create(payload);

  if (tags.length > 0) {
    await Promise.all(
      tags.map(async (tagName) => {
        const tag = await Tag.createOrGet(tagName);
        if (tag) {
          await tag.addQuestion(question._id);
        }
      })
    );
  }

  res.status(200).json({
    status: true,
    message: 'Question Created Successfully',
    question,
  });
});

const getSingleQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const question = await Question.findById(id)
    .populate('author', 'firstname lastname user_image')
    .populate('course', 'title')
    .populate('acceptedAnswerId', 'content author');

  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  res.status(200).json({
    status: true,
    message: 'Question Fetched Successfully',
    question,
  });
});

const getAllQuestions = asyncHandler(async (req, res) => {
  let { page, size, status, course, author, tag, search } = req.query;

  page = parseInt(page, 10) || 1;
  size = parseInt(size, 10) || 10;

  const limit = Math.max(size, 1);
  const skip = (Math.max(page, 1) - 1) * limit;

  const filter = {};

  if (status) {
    filter.status = status;
  }
  if (course) {
    validateMongodbId(course);
    filter.course = course;
  }
  if (author) {
    validateMongodbId(author);
    filter.author = author;
  }
  if (tag) {
    filter.tags = String(tag).toLowerCase().trim();
  }

  const query = search
    ? Question.find({ ...filter, $text: { $search: search } })
    : Question.find(filter);

  const questions = await query
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('author', 'firstname lastname user_image')
    .populate('course', 'title');

  res.status(200).json({
    status: true,
    page,
    size,
    message: 'All Questions Fetched Successfully',
    questions,
  });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const question = await Question.findById(id);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  if (!isOwnerOrAdmin(question.author, req.user)) {
    return res.status(403).json({
      status: false,
      message: 'You are not allowed to update this question',
    });
  }

  const updatePayload = { ...req.body };
  if (updatePayload.tags) {
    updatePayload.tags = normalizeTags(updatePayload.tags);
  }

  const updatedQuestion = await Question.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: true,
    message: 'Question Updated Successfully',
    question: updatedQuestion,
  });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const question = await Question.findById(id);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  if (!isOwnerOrAdmin(question.author, req.user)) {
    return res.status(403).json({
      status: false,
      message: 'You are not allowed to delete this question',
    });
  }

  await Answer.deleteMany({ question: question._id });
  await Question.findByIdAndDelete(id);

  res.status(200).json({
    status: true,
    message: 'Question Deleted Successfully',
  });
});

const upvoteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  validateMongodbId(id);

  const question = await Question.findById(id);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  if (question.author.toString() === userId.toString()) {
    return res.status(403).json({
      status: false,
      message: 'You cannot upvote your own question',
    });
  }

  await question.upvote(userId);

  res.status(200).json({
    status: true,
    message: 'Question upvoted successfully',
    upvotes: question.upvotes,
    downvotes: question.downvotes,
    rating: question.rating,
  });
});

const downvoteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  validateMongodbId(id);

  const question = await Question.findById(id);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  if (question.author.toString() === userId.toString()) {
    return res.status(403).json({
      status: false,
      message: 'You cannot downvote your own question',
    });
  }

  await question.downvote(userId);

  res.status(200).json({
    status: true,
    message: 'Question downvoted successfully',
    upvotes: question.upvotes,
    downvotes: question.downvotes,
    rating: question.rating,
  });
});

const addView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  validateMongodbId(id);

  const question = await Question.findById(id);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  await question.addView(userId);

  res.status(200).json({
    status: true,
    message: 'View recorded successfully',
    viewCount: question.viewCount,
  });
});

module.exports = {
  createQuestion,
  getSingleQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
  addView,
};
