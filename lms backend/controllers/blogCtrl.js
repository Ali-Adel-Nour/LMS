const Blog = require('../models/blogModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

const {default:slugify} = require("slugify")


const postBlog = asyncHandler (async(req,res)=>{

  try{

    if(req.body.title){
      req.body.slug = slugify(req.body.title.toLowerCase())
    }
  const blog = await Blog.create(req.body)


  res.status(200).json({
    status: true,
    message: 'Blog Created Successfully',
  })
}catch (err) {
  throw new Error(err)
}
});




//Get all docs


const getAllBlogs = asyncHandler (async(req,res)=>{
  try{

    const blog= await Blog.find()

    res.status(200).json({

      status: true,
      message: 'All Blogs Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})



//Get single doc

const getSingleBlog = asyncHandler (async(req,res)=>{
  const {slug} = req.params
  try{

    const blog= await Blog.findOne({slug:slug})

    res.status(200).json({
      status: true,
      message: 'Blog Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


const deleteBlog = asyncHandler (async(req,res)=>{
  const {id} = req.params
  validateMongodbId(id);
  try{

    const blog= await Blog.findByIdAndDelete(id)

    res.status(200).json({
      status: true,
      message: 'Blog Deleted Successfully',
    })

  }catch(err){
    throw new Error(err)
  }
})



const updateBlog = asyncHandler (async(req,res)=>{
  const {id} = req.params
  validateMongodbId(id);
  try{

    if(req.body.title){
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const blog= await Blog.findByIdAndUpdate(id,req.body,{new:true})

    res.status(200).json({
      status: true,
      message: 'Blog Updated Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


module.exports = {
  postBlog,
  getAllBlogs,
  getSingleBlog,
  deleteBlog,
  updateBlog,
}