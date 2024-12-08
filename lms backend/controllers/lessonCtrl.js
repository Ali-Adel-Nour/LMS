const Document = require('../models/lessonModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const { default: slugify } = require("slugify")
const Lesson = require('../models/lessonModel');


const postALesson = asyncHandler(async (req, res) => {

  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }
    const lesson = await Lesson.create(req.body)


    res.status(200).json({
      status: true,
      message: 'Lesson Created Successfully',
    })
  } catch (err) {
    throw new Error(err)
  }
});





const getAllLessons = asyncHandler(async (req, res) => {
  try {


    let  { page, size } = req.query;

    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const lesson = await Lesson.find().limit(limit).skip(skip)

    res.status(200).json({

      status: true,
      page,size,
      message: 'All Lessons Fetched Successfully',
      lesson
    })

  } catch (err) {
    throw new Error(err)
  }
})





const getSingleLesson = asyncHandler(async (req, res) => {
  const { slug } = req.params
  try {

    const lesson = await Lesson.findOne({ slug: slug })

    res.status(200).json({
      status: true,
      message: 'Lesson Fetched Successfully',
      lesson
    })

  } catch (err) {
    throw new Error(err)
  }
})


const deleteALesson = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    const lesson = await Lesson.findByIdAndDelete(id)

    res.status(200).json({
      status: true,
      message: 'Lesson Deleted Successfully',
    })

  } catch (err) {
    throw new Error(err)
  }
})



const updateALesson = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true })

    res.status(200).json({
      status: true,
      message: 'Lesson Updated Successfully',
      lesson
    })

  } catch (err) {
    throw new Error(err)
  }
})


module.exports = {
  postALesson,
  getAllLessons,
  getSingleLesson,
  deleteALesson,
  updateALesson,
}