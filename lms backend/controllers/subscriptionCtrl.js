const stripe = require('stripe')(process.env.STRIPE_KEY);
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

// Create a subscription
const createSubscription = asyncHandler(async (req, res) => {
  const { email, priceId } = req.body;
  const userId = req.user?._id;

  try {
    // Get or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log(`Using existing customer: ${customer.id}`);
    } else {
      customer = await stripe.customers.create({ email });
      console.log(`Created new customer: ${customer.id}`);
    }

    // Create a checkout session for the subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: userId ? userId.toString() : 'guest_user' },

      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    });

    // If user is logged in, store the pending subscription info
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        'stripe_account_id': customer.id,
        'pendingSubscription': {
          sessionId: session.id,
          priceId: priceId,
          createdAt: new Date()
        }
      });
    }

    res.status(200).json({
      status: true,
      sessionId: session.id,
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      status: false,
      message: 'Error creating subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check subscription
const checkSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(200).json({
      hasSubscription: false
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user?.stripe_account_id || !user?.stripeSession?.subscriptionId) {
      return res.status(200).json({ hasSubscription: false });
    }

    // Get latest subscription data from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSession.subscriptionId
    );

    // Get price details
    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const product = await stripe.products.retrieve(price.product);

    res.status(200).json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        plan_name: product.name,
        price: price.unit_amount / 100,
        interval: price.recurring.interval
      }
    });
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(200).json({ hasSubscription: false });
  }
});

// Update subscription
const updateSubscription = asyncHandler(async (req, res) => {
  const { priceId } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      status: false,
      error: 'Authentication required'
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user?.stripeSession?.subscriptionId) {
      return res.status(400).json({
        status: false,
        error: 'No active subscription found'
      });
    }

    // Update subscription in Stripe
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSession.subscriptionId
    );

    await stripe.subscriptions.update(
      subscription.id,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
      }
    );

    // Update in database
    await User.findByIdAndUpdate(userId, {
      'stripeSession.priceId': priceId
    });

    res.status(200).json({
      status: true,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update subscription'
    });
  }
});

// Cancel subscription
const cancelSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      status: false,
      error: 'Authentication required'
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user?.stripeSession?.subscriptionId) {
      return res.status(400).json({
        status: false,
        error: 'No active subscription found'
      });
    }

    // Cancel in Stripe
    await stripe.subscriptions.cancel(user.stripeSession.subscriptionId);

    // Update in database
    await User.findByIdAndUpdate(userId, {
      $unset: { stripeSession: "" }
    });

    res.status(200).json({
      status: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to cancel subscription'
    });
  }
});

const verifySubscriptionSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({
        status: false,
        message: 'Session not found'
      });
    }

    // Check session status
    if (session.payment_status !== 'paid') {
      return res.status(200).json({
        status: false,
        message: 'Payment not completed',
        session: {
          id: session.id,
          payment_status: session.payment_status
        }
      });
    }

    // Process successful subscription
    if (session.mode === 'subscription' && session.metadata?.userId) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // Update user subscription information
      await User.findByIdAndUpdate(session.metadata.userId, {
        'stripeSession': {
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0].price.id,
          currentPeriodEnd: subscription.current_period_end
        },
        $unset: { pendingSubscription: "" }
      });

      return res.status(200).json({
        status: true,
        message: 'Subscription activated successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end
        }
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Session verified',
      session: {
        id: session.id,
        payment_status: session.payment_status
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      status: false,
      message: 'Error verifying session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  createSubscription,
  checkSubscription,
  updateSubscription,
  cancelSubscription,
  verifySubscriptionSession
};