const Tutorial = require("../models/tutorialModel");

const asyncHandler = require('express-async-handler');


const {default: slugify} = require('slugify')

const postTutorial = asyncHandler(async(req,res)=>{
  try{
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }

    if(req.body.tutorialCategory){
      req.body.tutorialCategorySlug = slugify(
        req.body.tutorialCategory.toLowerCase()
      )
    }

    const postTut = await Tutorial.create(req.body)

    res.status(200).json({status:true,message:"Tutorial Created Successfully"})
  }catch(error){

    throw new Error(error);

  }
})

module.exports = {postTutorial}