const Tutorial = require("../models/tutorialModel");

const asyncHandler = require('express-async-handler');


const {default: slugify} = require('slugify')

const postTutorial = asyncHandler(async(req,res)=>{
  try{
    if (req.body.title) {
      req.body.slug = slugify(req.body.title.toLowerCase());
    }
  }catch(error){


  }
})

module.exports = {}