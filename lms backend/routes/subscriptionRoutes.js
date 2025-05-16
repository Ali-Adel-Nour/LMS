const express = require('express');
const {
  createSubscription,
  checkSubscription,
  updateSubscription,
  cancelSubscription,
  verifySubscriptionSession
} = require('../controllers/subscriptionCtrl');
const { authMiddleware } = require('../middleware/authMiddleware');

const rateLimter = require("../middleware/rateLimiter")

const subscriptionRouter = express.Router();

// Public routes
subscriptionRouter.post('/create-subscription',authMiddleware,rateLimter,  createSubscription);

subscriptionRouter.get('/verify-session/:sessionId', authMiddleware,rateLimter, verifySubscriptionSession);


subscriptionRouter.get('/check-subscription', authMiddleware,rateLimter, checkSubscription);
subscriptionRouter.post('/update-subscription', authMiddleware,rateLimter, updateSubscription);
subscriptionRouter.post('/cancel-subscription', authMiddleware,rateLimter, cancelSubscription);

module.exports = subscriptionRouter;