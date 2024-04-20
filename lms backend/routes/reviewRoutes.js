const { createReview } = require('../controllers/reviewCtrl');
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const reviewRouter = require('express').Router();

reviewRouter.post("/", authMiddleware, isAdmin, createReview);

module.exports = reviewRouter;