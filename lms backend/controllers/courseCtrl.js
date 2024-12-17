const Course = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const { default: slugify } = require("slugify");

const courseCategory = require("../models/courseCatModel");

const User = require("../models/userModel");

const Lesson = require("../models/lessonModel");



const getAllCoursesByCategory = asyncHandler(async (req, res) => {
  try{
  const { type } = req.params;

  const courses = await Course.find({ category: type });



  if(!type){
    return res.status(400).json({
      status: false,
      message: 'No Category Found',
    });
  }

  res.status(200).json({
    status: true,
    message: 'All Courses Fetched Successfully for particular category',
    courses
  });

}catch(err){
  res.status(500).json({
    status: false,
    message: err.message || 'Internal Server Error',
  });
}
});



const postCourse = asyncHandler(async (req, res) => {
  try {
    const instructorId = req.body.instructor;
    const lessonId = req.body.lesson;



    const courseCategoryExist = await courseCategory.findOne({ title: slugify(req.body.category.toLowerCase()) });


    if (!courseCategoryExist) {
      return res.status(400).json({
        status: false,
        message: "No Course Category with this name",
      });
    }

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    validateMongodbId(instructorId)

    const instructor = await User.findById(instructorId );
    if (!instructor) {
      return res.status(404).json({
        status: false,
        message: "Instructor not found"
      });
    }


    if (instructor.roles !== "instructor") {
      return res.status(403).json({
        status: false,
        message: "Only instructors can create courses"
      });
    }



    validateMongodbId(lessonId)

    let lesson = await Lesson.findById(lessonId);
    if(!lesson){
      return res.status(404).json({
        status: false,
        message: "Lesson not found"
      });
    }


    const course = await Course.create(req.body);

    res.status(200).json({
      status: true,
      message: 'Course Created Successfully',
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || 'Internal Server Error',
    });
  }
});

const getAllCourses = asyncHandler(async (req, res) => {
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

    const courses = await Course.find().limit(limit).skip(skip);

    if (!courses) {
      res.status(400).json({
        status: false,
        message: 'No Course In Database',
      });
    }

    res.status(200).json({
      status: true,
      page, size,
      message: 'All Courses Fetched Successfully',
      courses
    });
  } catch (err) {
    throw new Error(err);
  }
});

const getSingleCourse = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  try {
    const course = await Course.findOne({ slug: slug });
    console.log('Found course:', course); // Debug log


    if (!course) {
      res.status(404).json({
        status: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Course Fetched Successfully',
      course
    });
  } catch (err) {
    throw new Error(err);
  }
});

const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      res.status(404).json({
        status: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Course Deleted Successfully',
    });
  } catch (err) {
    throw new Error(err);
  }
});

const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const course = await Course.findByIdAndUpdate(id, req.body, { new: true });

    if (!course) {
      res.status(400).json({
        status: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Course Updated Successfully',
    });
  } catch (err) {
    throw new Error(err);
  }
});



module.exports = {
  postCourse,
  getAllCourses,
  getSingleCourse,
  deleteCourse,
  updateCourse,
  getAllCoursesByCategory
};