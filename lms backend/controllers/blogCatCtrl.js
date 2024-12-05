const BlogCat = require('../models/blogCatModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const slugify = require('slugify');



const postBlogCategory = asyncHandler(async (req, res) => {

  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }
    const existingCategory = await BlogCat.findOne({ slug: req.body.slug });
    if (existingCategory) {
      return res.status(400).json({
        status: false,
        message: 'Blog Category already exists. Please use a different title.',
      });
    }

    const blogCategory = await BlogCat.create(req.body);

    res.status(200).json({
      status: true,
      message: 'Blog Category Created Successfully',
      blogCategory
    })
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({
        status: false,
        message: 'Category already exists. Please use a different title.',
      });
    } else {
      res.status(500).json({
        status: false,
        message: 'An unexpected error occurred.',
      });
    }
  }
});






const getAllBlogsCategories = asyncHandler(async (req, res) => {
  try {

    let { page, size } = req.query;

    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const blogCategory = await BlogCat.find().limit(limit).skip(skip)

    if (!blogCategory) {
      res.status(404).json({
        status: false,
        message: 'Blog Category Not Found'
      })
    }
    res.status(200).json({

      status: true,
      page,size,
      message: 'All Blogs Categories Fetched Successfully',

    })

  } catch (err) {
    throw new Error(err)
  }
})



const getSingleBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const blogCategory = await BlogCat.findOne({ _id: id }); // Use _id instead of id for mongoose query

    if (!blogCategory) {
      return res.status(404).json({
        status: false,
        message: 'No Blog Category with This Id',
      });
    }


    return res.status(200).json({
      status: true,
      message: 'Blog Category Fetched Successfully',
      blogCategory,
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || 'Internal Server Error',
    });
  }
});


const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    const blogCategory = await BlogCat.findByIdAndDelete(id)

    if (!blogCategory) {
      res.status(404).json({
        status: false,
        message: 'No Blog Category with This Id'
      })
    }

    res.status(200).json({
      status: true,
      message: 'Blog Catgeory Deleted Successfully',
    })

  } catch (err) {
    throw new Error(err)
  }
})



const updateBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const blogCategory = await BlogCat.findByIdAndUpdate(id, req.body, { new: true })

    res.status(200).json({
      status: true,
      message: 'Blog Category Updated Successfully',

    })

  } catch (err) {
    throw new Error(err)
  }
})


module.exports = {
  postBlogCategory,
  getAllBlogsCategories,
  getSingleBlogCategory,
  deleteBlogCategory,
  updateBlogCategory,
}