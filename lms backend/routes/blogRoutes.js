const {
  postBlog,
  getAllBlogs,
  getSingleBlog,
  deleteBlog,
  updateBlog,
} = require("../controllers/blogCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const blogRouter = require('express').Router();

blogRouter.post("/", authMiddleware, isAdmin, rateLimter, postBlog);

blogRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllBlogs);

blogRouter.get("/:slug", authMiddleware, isAdmin, rateLimter, getSingleBlog);

blogRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateBlog);

blogRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteBlog);

module.exports = blogRouter