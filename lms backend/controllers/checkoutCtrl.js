const Course = require('../models/courseModel');
const Order = require('../models/ordersModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const stripe = require('stripe')(process.env.STRIPE_KEY);

// Create Stripe checkout session
const checkout = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Validate IDs
    validateMongodbId(courseId);
    validateMongodbId(userId);

    const course = await Course.findById(courseId);

     if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }



    // Check if user already purchased this course
    const existingOrder = await Order.findOne({
      course: courseId,
      user: userId,
      status: 'completed'
    });

    if (existingOrder) {
      return res.status(400).json({
        status: false,
        message: 'You have already purchased this course'
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description?.substring(0, 255) || '',
              images: [course.thumbnail]
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/course-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/courses/${course.slug}`,
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString()
      }
    });

    res.status(200).json({
      status: true,
      message: 'Checkout session created',
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

// Verify payment
const verifySession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({
        status: false,
        message: 'Payment not completed'
      });
    }

    // Check if we've already processed this session
    const existingOrder = await Order.findOne({
      'payment.transactionId': sessionId,
      status: 'completed'
    });

    if (existingOrder) {
      return res.status(200).json({
        status: true,
        message: 'Payment already verified',
        order: existingOrder
      });
    }

    // Create or update order
    const courseId = session.metadata.courseId;
    const userId = session.metadata.userId;

    const order = await Order.findOneAndUpdate(
      { 'payment.transactionId': sessionId },
      {
        course: courseId,
        user: userId,
        status: 'completed',
        payment: {
          transactionId: sessionId,
          method: 'stripe',
          amount: session.amount_total / 100,
          currency: session.currency,
          verified: true
        }
      },
      { new: true, upsert: true }
    );

    // Add course to user's enrolled courses (you may need to implement this)

    res.status(200).json({
      status: true,
      message: 'Payment verified successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

// Stripe webhook handler
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Create order record
      await Order.findOneAndUpdate(
        { 'payment.transactionId': session.id },
        {
          course: session.metadata.courseId,
          user: session.metadata.userId,
          status: 'completed',
          payment: {
            transactionId: session.id,
            method: 'stripe',
            amount: session.amount_total / 100,
            currency: session.currency,
            verified: true
          }
        },
        { new: true, upsert: true }
      );

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Create order manually for testing easier
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { courseId, paymentMethod = 'other', amount, currency = 'USD' } = req.body;
    const userId = req.user._id;

    // Validate IDs
    validateMongodbId(courseId);
    validateMongodbId(userId);

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: false,
        message: 'Course not found'
      });
    }

    // Check for duplicate purchase
    const existingOrder = await Order.findOne({
      course: courseId,
      user: userId,
      status: 'completed'
    });

    if (existingOrder) {
      return res.status(400).json({
        status: false,
        message: 'You have already purchased this course'
      });
    }

    // Create order
    const order = await Order.create({
      course: courseId,
      user: userId,
      status: 'pending', // Default to pending unless verified payment
      payment: {
        method: paymentMethod,
        amount: amount || course.price,
        currency,
        verified: false
      }
    });

    res.status(201).json({
      status: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

// Get user orders
const getUserOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate('course', 'title slug thumbnail price')
      .sort('-createdAt');

    res.status(200).json({
      status: true,
      message: 'Orders fetched successfully',
      orders
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

// Handle checkout success redirect
const handleCheckoutSuccess = asyncHandler(async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        status: false,
        message: 'Session ID is required'
      });
    }

    // Redirect to front-end success page with session ID
    res.redirect(`${process.env.FRONTEND_URL}/checkout/success?session_id=${session_id}`);

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

module.exports = {
  checkout,
  verifySession,
  handleStripeWebhook,
  createOrder,
  getUserOrders,
  handleCheckoutSuccess
};