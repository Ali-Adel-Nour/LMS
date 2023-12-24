const User = require("../models/userModel");

const asyncHandler = require("express-async-handler");

const generateToken = require("../config/jwtToken")
//Create A User

const registerAUser = asyncHandler(async(req,res)=>{
  //Get the email from req.body and find whether a user with this email exists or not

  const email = req.body.email;


  //Find the user with this email get from req.body

  const findUser = await User.findOne({email: email});

  // create a user
  if(!findUser){


  const createUser = await User.create(req.body)
  res.status(200).json({
    status:true,
    message:"User create successfully",
    createUser,
  })
  }else{
    throw new Error("User Already Exists")
  }



})
//login a user

const loginUser = asyncHandler(async(req,res)=>{

  const {email,password} = req.body

  //check if user exists or not

  const findUser = await User.findOne({email: email})

  if(findUser &&(await findUser.isPasswordMatch(password))){
      res.status(200).json({
        status:true,
        message:"Logged In Successfully",
        token:generateToken(findUser?._id),
        role:findUser?.roles,
        username:findUser?.firstname + " "+findUser?.lastname,
        user_image:findUser?.user_image,
      })
  }else{
    throw new Error("Invalid Creditnails")
  }

})


//Get all users

const getAllUsers = asyncHandler(async(req,res)=>{
  try{
    const allUsers = await User.find()
    res.status(200).json({status:true,message:"All Users Fetched successfully",allUsers})

  }catch(err){
    throw new Error(error)
  }
})

module.exports = {registerAUser,loginUser,getAllUsers};