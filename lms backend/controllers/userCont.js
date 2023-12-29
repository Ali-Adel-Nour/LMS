const User = require("../models/userModel");

const asyncHandler = require("express-async-handler");

const generateToken = require("../config/jwtToken")
const validateMongodbId = require("../config/valditeMongodb")
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



//Update user profile

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Validate MongoDB ID
  validateMongodbId(_id);

  try {
    const user = await User.findByIdAndUpdate(
      _id,
      req.body,
      { new: true } // Corrected position of the option
    );

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    res.status(200).json({ status: true, message: 'Profile updated successfully', user });
  } catch (err) {
    throw new Error(err);
  }
});


//delete a user

const deleteUser = asyncHandler(async(req, res )=>{
  const { _id } = req.params;
  //console.log('User ID to be deleted:', _id);
  try {
     await User.findByIdAndDelete(_id);

    res.status(200).json({ status: true, message: 'User Deleted successfully' });
  } catch (err) {
    throw new Error(err);
  }
})


module.exports = {registerAUser,loginUser,getAllUsers,updateUser,deleteUser };