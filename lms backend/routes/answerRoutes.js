const {
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
} = require('../controllers/answerCtrl');
const { authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter");
const answerRouter = require('express').Router();

answerRouter.post('/', authMiddleware, rateLimter, createAnswer);
answerRouter.get('/all', authMiddleware, rateLimter, getAllAnswers);
answerRouter.get('/question/:questionId', authMiddleware, rateLimter, getAnswersByQuestion);
answerRouter.post('/:id/upvote', authMiddleware, rateLimter, upvoteAnswer);
answerRouter.post('/:id/downvote', authMiddleware, rateLimter, downvoteAnswer);
answerRouter.post('/:id/mark-helpful', authMiddleware, rateLimter, markHelpful);
answerRouter.post('/:id/accept', authMiddleware, rateLimter, acceptAnswer);
answerRouter.get('/:id', authMiddleware, rateLimter, getSingleAnswer);
answerRouter.put('/:id/edit', authMiddleware, rateLimter, updateAnswer);
answerRouter.delete('/:id', authMiddleware, rateLimter, deleteAnswer);

module.exports = answerRouter;
