const {
  createQuestion,
  getSingleQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
  addView,
} = require('../controllers/questionCtrl');
const { authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter");
const questionRouter = require('express').Router();

questionRouter.post('/', authMiddleware, rateLimter, createQuestion);
questionRouter.get('/all', authMiddleware, rateLimter, getAllQuestions);
questionRouter.get('/:id', authMiddleware, rateLimter, getSingleQuestion);
questionRouter.post('/:id/upvote', authMiddleware, rateLimter, upvoteQuestion);
questionRouter.post('/:id/downvote', authMiddleware, rateLimter, downvoteQuestion);
questionRouter.post('/:id/view', authMiddleware, rateLimter, addView);
questionRouter.put('/:id/edit', authMiddleware, rateLimter, updateQuestion);
questionRouter.delete('/:id', authMiddleware, rateLimter, deleteQuestion);

module.exports = questionRouter;
