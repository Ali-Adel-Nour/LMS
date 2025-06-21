const Work = require('../models/workWithUsModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const User = require('../models/userModel');
const { client } = require('../config/redisConfig');
const { default: slugify } = require('slugify');
const ApiFeatures = require('../utils/apiFeatures');

// Create a work with us application
const postDetails = asyncHandler(async (req, res) => {
  try {
    // If there's a title field, create a slug
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    const work = await Work.create(req.body);

    res.status(201).json({
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

// Get all work with us applications with ApiFeatures
const getAllApplications = asyncHandler(async (req, res) => {
  try {
    // Generate cache key based on query parameters
    const queryString = JSON.stringify(req.query);
    const cacheKey = `work_applications:${Buffer.from(queryString).toString('base64')}`;

    // Check cache first
    try {
      const cachedApplications = await client.get(cacheKey);
      if (cachedApplications) {
        const cachedData = JSON.parse(cachedApplications);
        return res.status(200).json({
          status: true,
          message: 'Work Applications Fetched from Cache',
          ...cachedData
        });
      }
    } catch (cacheError) {
      console.log('Cache error:', cacheError.message);
    }

    // Get total count for pagination
    const totalCount = await Work.countDocuments();

    // Build query using ApiFeatures
    const features = new ApiFeatures(Work.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const applications = await features.query;
    const paginationInfo = features.G(totalCount);

    const responseData = {
      status: true,
      message: applications.length > 0 ? 'Work Applications Fetched Successfully' : 'No Work Applications Found',
      ...paginationInfo,
      applications
    };

    // Cache the results for 1 hour
    try {
      await client.setEx(cacheKey, 3600, JSON.stringify(responseData));
    } catch (cacheError) {
      console.log('Cache set error:', cacheError.message);
    }

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Error fetching work applications',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get single work application
const getSingleApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    // Check cache first
    const cacheKey = `work_application:${id}`;
    try {
      const cachedApplication = await client.get(cacheKey);
      if (cachedApplication) {
        return res.status(200).json({
          status: true,
          message: 'Work Application Fetched from Cache',
          application: JSON.parse(cachedApplication)
        });
      }
    } catch (cacheError) {
      console.log('Cache error:', cacheError.message);
    }

    const application = await Work.findById(id);

    if (!application) {
      return res.status(404).json({
        status: false,
        message: 'Work Application Not Found'
      });
    }

    // Cache single application for 30 minutes
    try {
      await client.setEx(cacheKey, 1800, JSON.stringify(application));
    } catch (cacheError) {
      console.log('Cache set error:', cacheError.message);
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

    const application = await Work.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!application) {
      return res.status(404).json({
        status: false,
        message: 'Work Application Not Found'
      });
    }

    // Clear relevant caches
    await clearWorkApplicationCaches(id);

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


    await clearWorkApplicationCaches(id);

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

// Get applications by status with ApiFeatures
const getApplicationsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;

  try {
    // Add status to query parameters
    const queryWithStatus = { ...req.query, status };

    // Generate cache key
    const queryString = JSON.stringify(queryWithStatus);
    const cacheKey = `work_applications_status:${status}:${Buffer.from(queryString).toString('base64')}`;

    // Check cache first
    try {
      const cachedApplications = await client.get(cacheKey);
      if (cachedApplications) {
        const cachedData = JSON.parse(cachedApplications);
        return res.status(200).json({
          status: true,
          message: `Applications with status '${status}' fetched from cache`,
          ...cachedData
        });
      }
    } catch (cacheError) {
      console.log('Cache error:', cacheError.message);
    }

    // Get total count for this status
    const totalCount = await Work.countDocuments({ status });

    // Build query using ApiFeatures
    const features = new ApiFeatures(Work.find({ status }), req.query)
      .sort()
      .limitFields()
      .paginate();

    const applications = await features.query;
    const paginationInfo = features.GetPaginationInfo(totalCount);

    const responseData = {
      status: true,
      message: applications.length > 0
        ? `Applications with status '${status}' fetched successfully`
        : `No applications found with status '${status}'`,
      filter: { status },
      ...paginationInfo,
      applications
    };

    // Cache the results for 30 minutes
    try {
      await client.setEx(cacheKey, 1800, JSON.stringify(responseData));
    } catch (cacheError) {
      console.log('Cache set error:', cacheError.message);
    }

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

// Helper function to clear caches
const clearWorkApplicationCaches = async (applicationId = null) => {
  try {
    // Clear all work application list caches
    const listCachePattern = 'work_applications:*';
    const statusCachePattern = 'work_applications_status:*';

    // Get keys matching patterns
    const listKeys = await client.keys(listCachePattern);
    const statusKeys = await client.keys(statusCachePattern);

    // Clear specific application cache if ID provided
    if (applicationId) {
      const singleCacheKey = `work_application:${applicationId}`;
      try {
        await client.del(singleCacheKey);
      } catch (error) {
        console.log('Error clearing single cache:', error.message);
      }
    }

    // Clear list and status caches
    const allKeys = [...listKeys, ...statusKeys];
    if (allKeys.length > 0) {
      try {
        await client.del(allKeys);
      } catch (error) {
        console.log('Error clearing multiple cache keys:', error.message);
      }
    }
  } catch (error) {
    console.log('Cache clearing error:', error.message);
  }
};

module.exports = {
  postDetails,
  getAllApplications,
  getSingleApplication,
  updateApplication,
  deleteApplication,
  getApplicationsByStatus
};