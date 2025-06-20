const express = require('express');
const {
  postDetails,
  getAllApplications,
  getSingleApplication,
  updateApplication,
  deleteApplication,
  getApplicationsByStatus
} = require('../controllers/workWithUsCtrl');
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require('../middleware/rateLimiter');

const workWithUsRouter = express.Router();

// Public route for submitting application
workWithUsRouter.post('/', rateLimter, postDetails);

// Admin routes
workWithUsRouter.get('/all', authMiddleware, isAdmin, rateLimter, getAllApplications);
workWithUsRouter.get('/status/:status', authMiddleware, isAdmin, rateLimter, getApplicationsByStatus);
workWithUsRouter.get('/:id', authMiddleware, isAdmin, rateLimter, getSingleApplication);
workWithUsRouter.put('/:id/edit', authMiddleware, isAdmin, rateLimter, updateApplication);
workWithUsRouter.delete('/:id', authMiddleware, isAdmin, rateLimter, deleteApplication);

module.exports = workWithUsRouter;