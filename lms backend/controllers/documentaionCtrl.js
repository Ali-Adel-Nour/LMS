const Document = require('../models/documentationModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const { client } = require('../config/redisConfig');

const { default: slugify } = require("slugify")


const postADoc = asyncHandler(async (req, res) => {

  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }
    const document = await Document.create(req.body)


    res.status(200).json({
      status: true,
      message: 'Document Created Successfully',
    })
  } catch (err) {
    throw new Error(err)
  }
});





const getAllDocs = asyncHandler(async (req, res) => {
  try {


    let  { page, size } = req.query;

    const cacheKey = `docs:page${page}:size${size}`;

    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }


    const cachedDocs = await client.get(cacheKey);
    if (cachedDocs) {
      return res.status(200).json({
        status: true,
        page, size,
        message: 'Documents Fetched from Cache',
        data: JSON.parse(cachedDocs)
      });
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const doc = await Document.find().limit(limit).skip(skip)

     client.setEx(cacheKey, 3600, JSON.stringify(doc));
    res.status(200).json({

      status: true,
      page,size,
      message: 'All Documents Fetched Successfully',
      doc
    })

  } catch (err) {
    throw new Error(err)
  }
})





const getSingleDoc = asyncHandler(async (req, res) => {
  const { slug } = req.params
  try {

    const doc = await Document.findOne({ slug: slug })

    res.status(200).json({
      status: true,
      message: 'Document Fetched Successfully',
      doc
    })

  } catch (err) {
    throw new Error(err)
  }
})


const deleteADoc = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    const doc = await Document.findByIdAndDelete(id)

    res.status(200).json({
      status: true,
      message: 'Document Deleted Successfully',
    })

  } catch (err) {
    throw new Error(err)
  }
})



const updateADoc = asyncHandler(async (req, res) => {
  const { id } = req.params
  validateMongodbId(id);
  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const doc = await Document.findByIdAndUpdate(id, req.body, { new: true })

    res.status(200).json({
      status: true,
      message: 'Document Updated Successfully',
      doc
    })

  } catch (err) {
    throw new Error(err)
  }
})


module.exports = {
  postADoc,
  getAllDocs,
  getSingleDoc,
  deleteADoc,
  updateADoc,
}