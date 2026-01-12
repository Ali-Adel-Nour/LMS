const {
  createBookSession,
  getAllBookSessions,
  getBookSession,
  deleteBookSession,
  updateBookSession,
  getUserBookSession,
  getInstructorSession
} = require("../controllers/bookSessionsCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const bookSessionRouter = require('express').Router();


bookSessionRouter.post("/", authMiddleware, rateLimter, createBookSession);

bookSessionRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllBookSessions);

bookSessionRouter.get("/:id", authMiddleware, isAdmin, rateLimter, getBookSession);

bookSessionRouter.get("/users/:id", authMiddleware, isAdmin, rateLimter, getUserBookSession);

bookSessionRouter.get("/instructors/:id", authMiddleware, isAdmin, rateLimter, getInstructorSession);

bookSessionRouter.put("/:id/edit", authMiddleware , rateLimter, updateBookSession);

bookSessionRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteBookSession);

module.exports = bookSessionRouter