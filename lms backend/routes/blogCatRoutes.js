const {
  postBlogCategory,
  getAllBlogsCategories,
  getSingleBlogCategory,
  deleteBlogCategory,
  updateBlogCategory,
} = require("../controllers/blogCatCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const blogCatRouter = require('express').Router();


blogCatRouter.post("/", authMiddleware, isAdmin,  postBlogCategory);

blogCatRouter.get("/all", authMiddleware, isAdmin, getAllBlogsCategories);

blogCatRouter.get("/:id", authMiddleware, isAdmin, getSingleBlogCategory);


blogCatRouter.put("/:id/edit", authMiddleware, isAdmin,  updateBlogCategory);

blogCatRouter.delete("/:id", authMiddleware, isAdmin, deleteBlogCategory);

module.exports = blogCatRouter

