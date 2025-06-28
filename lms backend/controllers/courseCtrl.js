const Course = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const { default: slugify } = require("slugify");

const courseCategory = require("../models/courseCatModel");

const User = require("../models/userModel");

const Lesson = require("../models/lessonModel");

const ApiFeatures = require('../utils/apiFeatures');

const getAllCoursesByCategory = asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;

    const courses = await Course.find({ category: type });



    if (!type) {
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

  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || 'Internal Server Error',
    });
  }
});



const postCourse = asyncHandler(async (req, res) => {
  try {
    const instructorId = req.body.instructor;
    //const lessonId = req.body.lesson;



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

    const instructor = await User.findById(instructorId);
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



    // validateMongodbId(lessonId)

    // let lesson = await Lesson.findById(lessonId);
    // if(!lesson){
    //   return res.status(404).json({
    //     status: false,
    //     message: "Lesson not found"
    //   });
    // }


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
    // Generate cache key based on query parameters
    const queryString = JSON.stringify(req.query);
    const cacheKey = `courses:${Buffer.from(queryString).toString('base64')}`;

    // Check cache first
    try {
      const cachedCourses = await client.get(cacheKey);
      if (cachedCourses) {
        const cachedData = JSON.parse(cachedCourses);
        return res.status(200).json({
          status: true,
          message: 'Courses Fetched from Cache',
          ...cachedData
        });
      }
    } catch (cacheError) {
      console.log('Cache error:', cacheError.message);
    }

    // Get total count for pagination
    const totalCount = await Course.countDocuments();

    // Build query using ApiFeatures
    const features = new ApiFeatures(Course.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const courses = await features.query;
    const paginationInfo = features.GetPaginationInfo(totalCount);

    const responseData = {
      status: true,
      message: courses.length > 0 ? 'Courses Fetched Successfully' : 'No Courses Found',
      ...paginationInfo,
      courses
    };

    // Cache the results
    try {
      await client.setEx(cacheKey, 3600, JSON.stringify(responseData));
    } catch (cacheError) {
      console.log('Cache set error:', cacheError.message);
    }

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Error fetching courses',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});


const getSingleCourse = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const course = await Course.findOne({ slug });

  if (!course) {
    return res.status(404).json({
      status: false,
      message: 'Course not found',
    });
  }

  return res.status(200).json({
    status: true,
    message: 'Course Fetched Successfully',
    course
  });
});


const getParticularInstructorCourses = asyncHandler(async (req, res) => {
  const { instructorId } = req.params;
  validateMongodbId(instructorId);
  try {
    const courses = await Course.find({ instructor: instructorId });

    if (!courses) {
      res.status(404).json({
        status: false,
        message: 'No Course Found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'All Courses Fetched Successfully',
      courses
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
  getAllCoursesByCategory,
  getParticularInstructorCourses,
};