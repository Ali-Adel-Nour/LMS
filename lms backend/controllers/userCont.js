const User = require("../models/userModel");

const asyncHandler = require("express-async-handler");


//Create A User

const registerAUser = asyncHandler(async(req,res)=>{
  //Get the email from req.body and find whether a user with this email exists or not

  const email = req.body.email;
 console.log(email)
})

module.exports = {registerAUser};