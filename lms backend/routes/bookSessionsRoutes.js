const {
  createBookSession,
  getAllBookSessions,
  getBookSession,
  deleteBookSession,
  updateBookSession,
  getUserBookSession,
  getInstructorSession,
  getMyBookSessions,
  getMyInstructorSessions,
  getAvailableTimeSlots
} = require("../controllers/bookSessionsCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const bookSessionRouter = require('express').Router();


bookSessionRouter.post("/", authMiddleware, rateLimter, createBookSession);

bookSessionRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllBookSessions);

// Get logged-in user's sessions
bookSessionRouter.get("/my-sessions", authMiddleware, rateLimter, getMyBookSessions);

bookSessionRouter.get("/available-time-slots", authMiddleware, rateLimter, getAvailableTimeSlots);

// Get logged-in instructor's sessions
bookSessionRouter.get("/my-instructor-sessions", authMiddleware, rateLimter, getMyInstructorSessions);

// Get specific user's session by session ID (admin check if it belongs to user)
bookSessionRouter.get("/users/:id", authMiddleware, rateLimter, getUserBookSession);

// Get all sessions for a specific instructor (by instructor ID)
bookSessionRouter.get("/instructors/:id", authMiddleware, rateLimter, getInstructorSession);

// Get single session by ID
bookSessionRouter.get("/:id", authMiddleware, rateLimter, getBookSession);

bookSessionRouter.put("/:id/edit", authMiddleware, rateLimter, updateBookSession);

bookSessionRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteBookSession);

module.exports = bookSessionRouter