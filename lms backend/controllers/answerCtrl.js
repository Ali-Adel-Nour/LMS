const Answer = require('../models/questions and answers/answerModel');
const Question = require('../models/questions and answers/questionModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const isOwnerOrAdmin = (resourceUserId, currentUser) => {
  if (!resourceUserId || !currentUser) {
    return false;
  }

  if (resourceUserId.toString() === currentUser._id.toString()) {
    return true;
  }

  return currentUser.roles === 'admin';
};

const createAnswer = asyncHandler(async (req, res) => {
  const authorId = req.user._id;
  const { question: questionId } = req.body;

  validateMongodbId(authorId);
  validateMongodbId(questionId);

  const question = await Question.findById(questionId);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  if (['closed', 'archived'].includes(question.status)) {
    return res.status(400).json({
      status: false,
      message: 'This question is not accepting answers',
    });
  }

  const payload = {
    ...req.body,
    author: authorId,
    question: questionId,
  };

  const answer = await Answer.create(payload);
  await Question.findByIdAndUpdate(questionId, { $inc: { answerCount: 1 } });

  res.status(200).json({
    status: true,
    message: 'Answer Created Successfully',
    answer,
  });
});

const getSingleAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const answer = await Answer.findById(id)
    .populate('author', 'firstname lastname user_image')
    .populate('question', 'title');

  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  res.status(200).json({
    status: true,
    message: 'Answer Fetched Successfully',
    answer,
  });
});

const getAllAnswers = asyncHandler(async (req, res) => {
  let { page, size, questionId, status, author } = req.query;

  page = parseInt(page, 10) || 1;
  size = parseInt(size, 10) || 10;

  const limit = Math.max(size, 1);
  const skip = (Math.max(page, 1) - 1) * limit;

  const filter = {};
  if (questionId) {
    validateMongodbId(questionId);
    filter.question = questionId;
  }
  if (status) {
    filter.status = status;
  }
  if (author) {
    validateMongodbId(author);
    filter.author = author;
  }

  const answers = await Answer.find(filter)
    .sort({ isAccepted: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('author', 'firstname lastname user_image')
    .populate('question', 'title');

  res.status(200).json({
    status: true,
    page,
    size,
    message: 'All Answers Fetched Successfully',
    answers,
  });
});

const getAnswersByQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  validateMongodbId(questionId);

  const answers = await Answer.find({ question: questionId })
    .sort({ isAccepted: -1, createdAt: -1 })
    .populate('author', 'firstname lastname user_image');

  res.status(200).json({
    status: true,
    message: 'Answers Fetched Successfully',
    answers,
  });
});

const updateAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const answer = await Answer.findById(id);
  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  if (!isOwnerOrAdmin(answer.author, req.user)) {
    return res.status(403).json({
      status: false,
      message: 'You are not allowed to update this answer',
    });
  }

  const updatePayload = { ...req.body };
  delete updatePayload.author;
  delete updatePayload.question;

  const updatedAnswer = await Answer.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: true,
    message: 'Answer Updated Successfully',
    answer: updatedAnswer,
  });
});

const deleteAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const answer = await Answer.findById(id);
  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  if (!isOwnerOrAdmin(answer.author, req.user)) {
    return res.status(403).json({
      status: false,
      message: 'You are not allowed to delete this answer',
    });
  }

  await Answer.findByIdAndDelete(id);

  if (answer.question) {
    await Question.findByIdAndUpdate(answer.question, { $inc: { answerCount: -1 } });

    if (answer.isAccepted) {
      await Question.findByIdAndUpdate(answer.question, {
        acceptedAnswerId: null,
        isResolved: false,
        resolvedAt: null,
        status: 'published',
      });
    }
  }

  res.status(200).json({
    status: true,
    message: 'Answer Deleted Successfully',
  });
});

const upvoteAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  validateMongodbId(id);

  const answer = await Answer.findById(id);
  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  if (answer.author.toString() === userId.toString()) {
    return res.status(403).json({
      status: false,
      message: 'You cannot upvote your own answer',
    });
  }

  await answer.upvote(userId);

  res.status(200).json({
    status: true,
    message: 'Answer upvoted successfully',
    upvotes: answer.upvotes,
    downvotes: answer.downvotes,
    rating: answer.rating,
  });
});

const downvoteAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  validateMongodbId(id);

  const answer = await Answer.findById(id);
  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  if (answer.author.toString() === userId.toString()) {
    return res.status(403).json({
      status: false,
      message: 'You cannot downvote your own answer',
    });
  }

  await answer.downvote(userId);

  res.status(200).json({
    status: true,
    message: 'Answer downvoted successfully',
    upvotes: answer.upvotes,
    downvotes: answer.downvotes,
    rating: answer.rating,
  });
});

const markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { helpful } = req.body;
  const userId = req.user._id;
  validateMongodbId(id);

  if (helpful === undefined || typeof helpful !== 'boolean') {
    return res.status(400).json({
      status: false,
      message: 'helpful must be a boolean value',
    });
  }

  const answer = await Answer.findById(id);
  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  await answer.markHelpful(userId, helpful);

  res.status(200).json({
    status: true,
    message: `Answer marked as ${helpful ? 'helpful' : 'not helpful'} successfully`,
    helpfulCount: answer.helpfulCount,
    notHelpfulCount: answer.notHelpfulCount,
    helpfulRatio: answer.helpfulRatio,
  });
});

const acceptAnswer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  validateMongodbId(id);

  const answer = await Answer.findById(id);
  if (!answer) {
    return res.status(404).json({
      status: false,
      message: 'Answer not found',
    });
  }

  const question = await Question.findById(answer.question);
  if (!question) {
    return res.status(404).json({
      status: false,
      message: 'Question not found',
    });
  }

  if (question.author.toString() !== userId.toString() && req.user.roles !== 'admin') {
    return res.status(403).json({
      status: false,
      message: 'Only the question author or admin can accept answers',
    });
  }

  await answer.acceptAsAnswer(userId);
  await Question.findByIdAndUpdate(answer.question, {
    acceptedAnswerId: answer._id,
    isResolved: true,
    resolvedAt: new Date(),
    status: 'resolved',
  });

  res.status(200).json({
    status: true,
    message: 'Answer accepted successfully',
    answer,
  });
});

module.exports = {
  createAnswer,
  getSingleAnswer,
  getAllAnswers,
  getAnswersByQuestion,
  updateAnswer,
  deleteAnswer,
  upvoteAnswer,
  downvoteAnswer,
  markHelpful,
  acceptAnswer,
};
