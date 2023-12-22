const User = require("../models/userModel");

const asyncHandler = require("express-async-handler");


//Create A User

const registerAUser = asyncHandler(async(req,res)=>{
  //Get the email from req.body and find whether a user with this email exists or not

  const email = req.body.email;


  //Find the user with this email get from req.body

  const findUser = await User.findOne({email: email});

  // create a user
  if(!findUser){


  const createUser = await User.create(req.body)
  res.status(200).json(createUser)
  }else{
    throw new Error("User Already Exists")
  }



})


module.exports = {registerAUser};