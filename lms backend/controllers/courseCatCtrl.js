const CourseCategory = require('../models/courseCatModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const  slugify  = require("slugify");

const postCourseCategory = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const existingCategory = await CourseCategory.findOne({ slug: req.body.slug });
    if (existingCategory) {
      return res.status(400).json({
        status: false,
        message: 'Course Category already exists. Please use a different title.',
      });
    }

    const courseCategory = await CourseCategory.create(req.body);

    res.status(200).json({
      status: true,
      message: 'Course Category Created Successfully',
      courseCategory,
    });
  }
  catch (err) {
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

const getAllCourseCategories = asyncHandler(async (req, res) => {
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

    const courseCategories = await CourseCategory.find().limit(limit).skip(skip);

    if (!courseCategories) {
      res.status(404).json({
        status: false,
        message: 'Course Categories Not Found',
      });
    }
    res.status(200).json({
      status: true,
      page, size,
      message: 'All Course Categories Fetched Successfully',
      courseCategories,
    });
  } catch (err) {
    throw new Error(err);
  }
});

const getSingleCourseCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const courseCategory = await CourseCategory.findOne({ _id: id });

    if (!courseCategory) {
      return res.status(404).json({
        status: false,
        message: 'No Course Category with This Id',
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Course Category Fetched Successfully',
      courseCategory,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || 'Internal Server Error',
    });
  }
});

const deleteCourseCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const courseCategory = await CourseCategory.findByIdAndDelete(id);

    if (!courseCategory) {
      res.status(404).json({
        status: false,
        message: 'No Course Category with This Id',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Course Category Deleted Successfully',
    });
  } catch (err) {
    throw new Error(err);
  }
});

const updateCourseCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const courseCategory = await CourseCategory.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({
      status: true,
      message: 'Course Category Updated Successfully',
      courseCategory,
    });
  } catch (err) {
    throw new Error(err);
  }
});

module.exports = {
  postCourseCategory,
  getAllCourseCategories,
  getSingleCourseCategory,
  deleteCourseCategory,
  updateCourseCategory,
};