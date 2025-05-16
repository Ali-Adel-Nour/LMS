const express = require('express');
const {
  createSubscription,
  checkSubscription,
  updateSubscription,
  cancelSubscription,
  //verifySubscriptionSession
} = require('../controllers/subscriptionCtrl');
const { authMiddleware } = require('../middleware/authMiddleware');

const subscriptionRouter = express.Router();

// Public routes
subscriptionRouter.post('/create-subscription', createSubscription);

// Protected routes
subscriptionRouter.get('/check-subscription', authMiddleware, checkSubscription);
subscriptionRouter.post('/update-subscription', authMiddleware, updateSubscription);
subscriptionRouter.post('/cancel-subscription', authMiddleware, cancelSubscription);
//subscriptionRouter.get('/verify-session/:sessionId', verifySubscriptionSession);

module.exports = subscriptionRouter;