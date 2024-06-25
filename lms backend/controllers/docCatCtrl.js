const DocCat = require('../models/docCatModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');




const postDocCategory = asyncHandler (async(req,res)=>{

  try{

  const docCategory= await DocCat.create(req.body)


  res.status(200).json({
    status: true,
    message: 'Documentation Category Created Successfully',
  })
}catch (err) {
  throw new Error(err)
}
});




//Get all docs


const getAllDocsCatgories = asyncHandler (async(req,res)=>{
  try{

    const docCategory= await DocCat.find()

    res.status(200).json({

      status: true,
      message: 'All Documentations Categories Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})



//Get single doc

const getSingleDocCategory= asyncHandler (async(req,res)=>{
  const {id} = req.params
  try{

    const docCategory= await DocCat.findOne({id})

    res.status(200).json({
      status: true,
      message: 'Documenantation Category Fetched Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


const deleteDocCategory= asyncHandler (async(req,res)=>{
  const {id} = req.params
  validateMongodbId(id);
  try{

    const docCategory= await DocCat.findByIdAndDelete(id)

    res.status(200).json({
      status: true,
      message: 'Documentation Catgeory Deleted Successfully',
    })

  }catch(err){
    throw new Error(err)
  }
})



const updateDocCategory= asyncHandler (async(req,res)=>{
  const {id} = req.params
  validateMongodbId(id);
  try{

    if(req.body.title){
      req.body.slug = slugify(req.body.title.toLowerCase())
    }

    const docCategory= await DocCat.findByIdAndUpdate(id,req.body,{new:true})

    res.status(200).json({
      status: true,
      message: 'Documentation Category Updated Successfully',
      doc
    })

  }catch(err){
    throw new Error(err)
  }
})


module.exports = {
  postDocCategory,
  getAllDocsCatgories,
  getSingleDocCategory,
  deleteDocCategory,
  updateDocCategory,
}