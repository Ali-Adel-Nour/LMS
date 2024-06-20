const {
  postBlog,
  getAllBlogs,
  getSingleBlog,
  deleteBlog,
  updateBlog,
} = require("../controllers/blogCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const blogRouter = require('express').Router();


blogRouter.post("/", authMiddleware, isAdmin,  postBlog);

blogRouter.get("/all", authMiddleware, isAdmin, getAllBlogs);

blogRouter.get("/:slug", authMiddleware, isAdmin, getSingleBlog);


blogRouter.put("/:id/edit", authMiddleware, isAdmin,  updateBlog);

blogRouter.delete("/:id", authMiddleware, isAdmin, deleteBlog);

module.exports = blogRouter