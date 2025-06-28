const {
  postCourse,
  getAllCourses,
  getSingleCourse,
  deleteCourse,
  updateCourse,
  getAllCoursesByCategory,
  getParticularInstructorCourses,

} = require("../controllers/courseCtrl")
const { isAdmin, authMiddleware, isBoth } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const courseRouter = require('express').Router();


courseRouter.get("/all", authMiddleware, rateLimter, getAllCourses);
courseRouter.post("/", authMiddleware, isBoth, rateLimter, postCourse);

// Routes with additional path segments
courseRouter.get("/instructor/:instructorId", authMiddleware, rateLimter, getParticularInstructorCourses);
courseRouter.get("/category/:type", authMiddleware, isBoth, rateLimter, getAllCoursesByCategory);

// Specific operations with IDs
courseRouter.put("/:id/edit", authMiddleware, isBoth, rateLimter, updateCourse);
courseRouter.delete("/:id", authMiddleware, isBoth, rateLimter, deleteCourse);

// Catch-all for slug-based
courseRouter.get("/:slug", authMiddleware, rateLimter, getSingleCourse);

module.exports = courseRouter