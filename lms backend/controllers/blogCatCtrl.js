const BlogCat = require('../models/blogCatModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');




const postBlogCategory = asyncHandler (async(req,res)=>{

  try{

  const blogCategory = await BlogCat.create(req.body)


  res.status(200).json({
    status: true,
    message: 'Blog Category Created Successfully',
  })
}catch (err) {
  throw new Error(err)
}
});




//Get all docs


const getAllBlogsCatgories = asyncHandler (async(req,res)=>{
  try{

    const blogCategory= await BlogCat.find()

    res.status(200).json({

      status: true,
      message: 'All Blogs Categories Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})



//Get single doc

const getSingleBlogCategory = asyncHandler (async(req,res)=>{
  const {id} = req.params
  try{

    const blogCategory= await BlogCat.findOne({id})

    res.status(200).json({
      status: true,
      message: 'Blog Category Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


const deleteBlogCategory = asyncHandler (async(req,res)=>{
  const {id} = req.params
  validateMongodbId(id);
  try{

    const blogCategory= await BlogCat.findByIdAndDelete(id)

    res.status(200).json({
      status: true,
      message: 'Blog Catgeory Deleted Successfully',
    })

  }catch(err){
    throw new Error(err)
  }
})



const updateBlogCategory = asyncHandler (async(req,res)=>{
  const {id} = req.params
  validateMongodbId(id);
  try{

    if(req.body.title){
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const blogCategory= await BlogCat.findByIdAndUpdate(id,req.body,{new:true})

    res.status(200).json({
      status: true,
      message: 'Blog Category Updated Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


module.exports = {
  postBlogCategory,
  getAllBlogsCategories,
  getSingleBlogCategory,
  deleteBlogCategory,
  updateBlogCategory,
}