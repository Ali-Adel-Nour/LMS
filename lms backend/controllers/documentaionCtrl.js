const Document = require('../models/documentationModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const {default:slugify} = require("slugify")


const postADoc = asyncHandler (async(req,res)=>{

  try{

    if(req.body.title){
      req.body.slug = slugify(req.body.title.toLowerCase())
    }
  const document = await Document.create(req.body)


  res.status(200).json({
    status: true,
    message: 'Document Created Successfully',
  })
}catch (err) {
  throw new Error(err)
}
});




//Get all docs


const getAllDocs = asyncHandler (async(req,res)=>{
  try{

    const doc = await Document.find()

    res.status(200).json({

      status: true,
      message: 'All Documents Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})



//Get single doc

const getSingleDoc = asyncHandler (async(req,res)=>{
  const {slug} = req.params
  try{

    const doc = await Document.findOne({slug:slug})

    res.status(200).json({
      status: true,
      message: 'Document Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


const deleteADoc = asyncHandler (async(req,res)=>{
  const {id} = req.parms
  validateMongodbId(id);
  try{

    const doc = await Document.findByIdAndDelete(id)

    res.status(200).json({
      status: true,
      message: 'Document Deleted Successfully',
    })

  }catch(err){
    throw new Error(err)
  }
})



const updateADoc = asyncHandler (async(req,res)=>{
  const {id} = req.parms
  validateMongodbId(id);
  try{

    if(req.body.title){
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const doc = await Document.findByIdAndUpdate(id,req.body,{new:true})

    res.status(200).json({
      status: true,
      message: 'Document Updated Successfully',
    })

  }catch(err){
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