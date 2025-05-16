const checkoutRouter = require('express').Router();

const {
  checkout,
  verifySession,
  handleStripeWebhook,
  createOrder,
  getUserOrders,
   handleCheckoutSuccess,

} = require('../controllers/checkoutCtrl');

const { authMiddleware } = require('../middleware/authMiddleware');





checkoutRouter.post('/create-checkout-session', authMiddleware, checkout);


checkoutRouter.get('/verify-session/:sessionId',authMiddleware, verifySession);

checkoutRouter.get('/orders', authMiddleware,getUserOrders);

// Webhook endpoint for Stripe events
checkoutRouter.post('/webhook', handleStripeWebhook);

checkoutRouter.post('/order', authMiddleware, createOrder);

checkoutRouter.get('/success', handleCheckoutSuccess);

module.exports = checkoutRouter;