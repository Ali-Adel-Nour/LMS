const TutotrialCategory = require('../models/tutCategory');
const { default: slugify } = require('slugify')
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');


const postTutorialCategory = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const postTutCat = await TutotrialCategory.create(req.body);
    res.status(200).json({
      status: true,
      message: 'Tutorial Category Created Successfully',
    });
  } catch (error) {
    throw new Error(error);
  }
});


const getAllCategory = asyncHandler(async (req, res) => {

  try {
    const alltutcat = await TutotrialCategory.find()
    res.status(200).json({
      status: true, message: 'Tutorial Category Fetched Successfully', alltutcat
    })


  } catch (error) {
    throw new Error(error);
  }
})

const getATutorial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const getATut = await TutotrialCategory.findById(id)
    res.status(200).json({
      status: true, message: 'Tutorial Category Fetched Successfully', getATut
    })


  } catch (error) {
    throw new Error(error);
  }
})


const DeleteATutorialCat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const deleteAtut = await TutotrialCategory.findByIdAndDelete(id)
    res.status(200).json({
      status: true, message: 'Tutorial Category Deleted Successfully', deleteAtut
    })


  } catch (error) {
    throw new Error(error);
  }
})

const updateTutorialCat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }
    const updateAtut = await TutotrialCategory.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({
      status: true, message: 'Tutorial Category Updated Successfully', updateAtut
    })


  } catch (error) {
    throw new Error(error);
  }
})



module.exports = {
  postTutorialCategory,
  getAllCategory,
  getATutorial,
  DeleteATutorialCat,
  updateTutorialCat
}