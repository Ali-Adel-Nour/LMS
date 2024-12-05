const {
  postCourseCategory,
  getAllCourseCategories,
  getSingleCourseCategory,
  deleteCourseCategory,
  updateCourseCategory,
} = require("../controllers/courseCatCtrl")
const { authMiddleware,isAdmin,isBoth } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const courseCatRouter = require('express').Router();

courseCatRouter.post("/", authMiddleware, isAdmin, isBoth, rateLimter, postCourseCategory);

courseCatRouter.get("/all", authMiddleware, isAdmin, isBoth, rateLimter, getAllCourseCategories);

courseCatRouter.get("/:slug", authMiddleware, isAdmin, isBoth, rateLimter, getSingleCourseCategory);

courseCatRouter.put("/:id/edit", authMiddleware, isAdmin, isBoth, rateLimter, updateCourseCategory);

courseCatRouter.delete("/:id", authMiddleware, isAdmin, isBoth, rateLimter, deleteCourseCategory);

module.exports = courseCatRouter