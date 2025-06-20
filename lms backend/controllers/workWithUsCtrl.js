const Work = require('../models/workWithUsModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const User = require('../models/userModel');
const { client } = require('../config/redisConfig');
const { default: slugify } = require('slugify');

// Create a work with us application
const postDetails = asyncHandler(async (req, res) => {
  try {
    // If there's a title field, create a slug
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const work = await Work.create(req.body);

    res.status(200).json({
      status: true,
      message: 'Work With Us Application Submitted Successfully',
      work
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({
        status: false,
        message: 'Application with this email already exists.',
      });
    } else {
      res.status(500).json({
        status: false,
        message: 'An unexpected error occurred.',
        error: err.message,
      });
    }
  }
});

// Get all work with us applications
const getAllApplications = asyncHandler(async (req, res) => {
  try {
    let { page, size } = req.query;

    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }

    page = parseInt(page) || 1;
    size = parseInt(size) || 10;

    page = Math.max(page, 1);
    size = Math.max(size, 1);

    const cacheKey = `work_applications:page${page}:size${size}`;

    // Check cache first
    const cachedApplications = await client.get(cacheKey);
    if (cachedApplications) {
      return res.status(200).json({
        status: true,
        page,
        size,
        message: 'Work Applications Fetched from Cache',
        data: JSON.parse(cachedApplications)
      });
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const applications = await Work.find().limit(limit).skip(skip).sort('-createdAt');

    // Cache the results
    await client.setEx(cacheKey, 3600, JSON.stringify(applications));

    res.status(200).json({
      status: true,
      page,
      size,
      message: 'All Work Applications Fetched Successfully',
      applications
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

// Get single work application
const getSingleApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const application = await Work.findById(id);

    if (!application) {
      return res.status(404).json({
        status: false,
        message: 'Work Application Not Found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Work Application Fetched Successfully',
      application
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

// Update work application
const updateApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    // If updating title, regenerate slug
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const application = await Work.findByIdAndUpdate(id, req.body, { new: true });

    if (!application) {
      return res.status(404).json({
        status: false,
        message: 'Work Application Not Found'
      });
    }

    // Clear relevant cache
    const cachePattern = 'work_applications:*';
    const keys = await client.keys(cachePattern);
    if (keys.length > 0) {
      await client.del(keys);
    }

    res.status(200).json({
      status: true,
      message: 'Work Application Updated Successfully',
      application
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

// Delete work application
const deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const application = await Work.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({
        status: false,
        message: 'Work Application Not Found'
      });
    }

    // Clear relevant cache
    const cachePattern = 'work_applications:*';
    const keys = await client.keys(cachePattern);
    if (keys.length > 0) {
      await client.del(keys);
    }

    res.status(200).json({
      status: true,
      message: 'Work Application Deleted Successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

// Get applications by status
const getApplicationsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  let { page, size } = req.query;

  try {
    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const applications = await Work.find({ status })
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    res.status(200).json({
      status: true,
      page,
      size,
      message: `Applications with status '${status}' fetched successfully`,
      applications
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

module.exports = {
  postDetails,
  getAllApplications,
  getSingleApplication,
  updateApplication,
  deleteApplication,
  getApplicationsByStatus
};