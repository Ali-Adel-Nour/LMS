const checkoutRouter = require('express').Router();

const {
  checkout,
  verifySession,
  handleStripeWebhook,
  createOrder,
  getUserOrders,
   handleCheckoutSuccess,

} = require('../controllers/checkoutCtrl');

const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');


const rateLimter = require("../middleware/rateLimiter")


checkoutRouter.post('/create-checkout-session', authMiddleware,rateLimter, checkout);


checkoutRouter.get('/verify-session/:sessionId',authMiddleware,rateLimter, verifySession);

checkoutRouter.get('/orders', authMiddleware,rateLimter,getUserOrders);

// Webhook endpoint for Stripe events
checkoutRouter.post('/webhook', handleStripeWebhook);

checkoutRouter.post('/order', authMiddleware,isAdmin, rateLimter,createOrder);

checkoutRouter.get('/success', handleCheckoutSuccess);

module.exports = checkoutRouter;