const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

//create Review i will not use try and catch to test async handler


const createReview = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongodbId(_id);



  let data = { user: _id, email: req.body.email, comment: req.body.comment, color: req.body.color, rating: req.body.rating };
  const review = await Review.create(data)


  res.status(200).json({
    status: true,
    message: 'Review Created Successfully',
  })

})





const getSingleReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const review = await Review.findById(id)


  res.status(200).json({
    status: true,
    message: 'Review Fetched Successfully',
    review,
  })

})



const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const review = await Review.findByIdAndUpdate(id, req.body, { new: true })


  res.status(200).json({
    status: true,
    message: 'Review Updated Successfully',
    review,
  })

})



const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const review = await Review.findByIdAndDelete(id)


  res.status(200).json({
    status: true,
    message: 'Review Deleted Successfully',
    review,
  })

})




const getAllReviews = asyncHandler(async (req, res) => {



  let = { page, size } = req.query;

  if (!page) {
    page = 1;
  }
  if (!size) {
    size = 10;
  }

  const limit = parseInt(size);
  const skip = (page - 1) * size;

  const review = await Review.find().limit(limit).skip(skip)


  res.status(200).json({
    status: true,
    page,size,
    message: 'All Reviews Fetched Successfully',
    review
  })

})





module.exports = { createReview, getSingleReview, getAllReviews, updateReview, deleteReview };