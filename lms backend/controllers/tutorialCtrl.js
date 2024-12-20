const Tutorial = require('../models/tutorialModel');

const asyncHandler = require('express-async-handler');

const { default: slugify } = require('slugify');
const TutorialCategory = require('../models/tutCategory');

const validateMongodbId = require('../config/valditeMongodb');
const postTutorial = asyncHandler(async (req, res) => {
  try {
    // Check if the tutorial category exists in the database
    const categoryExists = await TutorialCategory.findOne({
      slug: slugify(req.body.tutorialCategory.toLowerCase()),
  });

  if (!categoryExists) {
      return res.status(400).json({
          status: false,
          message: 'Tutorial category does not exist.',
      });
  }
    // Create the tutorial
    const postTut = await Tutorial.create(req.body);

    res.status(200).json({
      status: true,
      message: 'Tutorial Created Successfully',
      postTut,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
});
const getATutorial = asyncHandler(async (req, res) => {
  const { slug, type } = req.params;

  try {
    const getATutData = await Tutorial.findOne({
      slug: slug,
      tutorialCategorySlug: type,
    });

    const tutorialTopics = await Tutorial.find({
      tutorialCategorySlug: type,
    })
      .select('topicName title name slug tutorialCategorySlug')
      .sort('createdAt');

    res.status(200).json({
      status: true,
      message: 'Data Fetched Successfully',
      getATutData,
      tutorialTopics,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateATutorial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    if (req.body.tutorialCategory) {
      req.body.tutorialCategorySlug = slugify(
        req.body.tutorialCategory.toLowerCase()
      );
    }

    const updateATutorialData = await Tutorial.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updateATutorialData) {
      return res.status(404).json({
        status: false,
        message: 'Tutorial not found ',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Data Updated Successfully',
    });
  } catch (error) {
    throw new Error(error);
  }
});

const deleteATutorial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const deleteATutorialData = await Tutorial.findByIdAndDelete(
      id,
      req.body,
      { new: true }
    );

    if (!deleteATutorialData) {
      return res.status(404).json({
        status: false,
        message: 'Tutorial not found or already deleted',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Data Deleted Successfully',
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAllTutorials = asyncHandler(async (req, res) => {
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

    const allTutorials = await Tutorial.find().limit(limit).skip(skip);

    res.status(200).json({
      status: true,
      page,size,
      message: 'All Tutorials Fetched Successfully',
      allTutorials,
    });
  } catch (error) {
    throw new Error(error);
  }
});
module.exports = {
  postTutorial,
  getAllTutorials,
  updateATutorial,
  deleteATutorial,
  getATutorial,
};