const {
  postCourse,
  getAllCourses,
  getSingleCourse,
  deleteCourse,
  updateCourse,
  getAllCoursesByCategory
} = require("../controllers/courseCtrl")
const { isAdmin, authMiddleware,isBoth } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const courseRouter = require('express').Router();

courseRouter.post("/", authMiddleware, isAdmin, isBoth, rateLimter, postCourse);



courseRouter.get("/:slug", authMiddleware, isAdmin,  rateLimter, getSingleCourse);



courseRouter.get("/all", authMiddleware, isAdmin,  rateLimter, getAllCourses);



courseRouter.get("/:type", authMiddleware, isAdmin,  rateLimter, getAllCoursesByCategory);


courseRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateCourse);




courseRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteCourse);

module.exports = courseRouter