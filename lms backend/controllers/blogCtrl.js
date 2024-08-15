const Blog = require('../models/blogModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const { default: slugify } = require("slugify")


const postBlog = asyncHandler(async (req, res) => {

  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }
    const blog = await Blog.create(req.body)


    res.status(200).json({
      status: true,
      message: 'Blog Created Successfully',
    })
  } catch (err) {
    throw new Error(err)
  }
});





const getAllBlogs = asyncHandler(async (req, res) => {
  try {

    let = { page, size } = req.query;

    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;


    const blogs = await Blog.find().limit(limit).skip(skip)

    if (!blogs) {

      res.status(400).json({
        status: false,
        message: 'No Blog In Database',
      })

    }

    res.status(200).json({

      status: true,
      page,size,
      message: 'All Blogs Fetched Successfully',
      blogs
    })

  } catch (err) {
    throw new Error(err)
  }
})





const getSingleBlog = asyncHandler(async (req, res) => {
  const { slug } = req.params
  try {

    const blog = await Blog.findOne({ slug: slug })

    if (!blog) {

      res.status(400).json({
        status: false,
        message: 'Blog not found',
      })

    }

    res.status(200).json({
      status: true,
      message: 'Blog Fetched Successfully',
      blog

    })

  } catch (err) {
    throw new Error(err)
  }
})


const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    const blog = await Blog.findByIdAndDelete(id)

    if (!blog) {

      res.status(404).json({
        status: false,
        message: 'Blog not found',
      })

    }

    res.status(200).json({
      status: true,
      message: 'Blog Deleted Successfully',
    })

  } catch (err) {
    throw new Error(err)
  }
})



const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const blog = await Blog.findByIdAndUpdate(id, req.body, { new: true })


    if (!blog) {

      res.status(400).json({
        status: false,
        message: 'Blog not found',
      })

    }

    res.status(200).json({
      status: true,
      message: 'Blog Updated Successfully',

    })

  } catch (err) {
    throw new Error(err)
  }
})


module.exports = {
  postBlog,
  getAllBlogs,
  getSingleBlog,
  deleteBlog,
  updateBlog,
}