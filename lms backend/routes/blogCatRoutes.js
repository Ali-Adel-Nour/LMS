const {
  postBlogCategory,
  getAllBlogsCategories,
  getSingleBlogCategory,
  deleteBlogCategory,
  updateBlogCategory,
} = require("../controllers/blogCatCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const blogCatRouter = require('express').Router();


blogCatRouter.post("/", authMiddleware, isAdmin, rateLimter, postBlogCategory);

blogCatRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllBlogsCategories);

blogCatRouter.get("/:id", authMiddleware, isAdmin, rateLimter, getSingleBlogCategory);

blogCatRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateBlogCategory);

blogCatRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteBlogCategory);

module.exports = blogCatRouter

