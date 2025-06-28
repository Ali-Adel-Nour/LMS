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
courseRouter.get("/:type", authMiddleware, isBoth, rateLimter, getAllCoursesByCategory);
courseRouter.get("/:instructorId/all-courses", authMiddleware, rateLimter, getParticularInstructorCourses);
courseRouter.get("/:slug", authMiddleware, rateLimter, getSingleCourse);
courseRouter.post("/", authMiddleware, isBoth, rateLimter, postCourse);
courseRouter.put("/:id/edit", authMiddleware, isBoth, rateLimter, updateCourse);
courseRouter.delete("/:id", authMiddleware, isBoth, rateLimter, deleteCourse);

module.exports = courseRouter