const express = require('express');

const {registerAUser,
  loginUser,
  getAllUsers,
  updateUser,
  deleteUser,

} = require('../controllers/userCont')

const {isAdmin,authMiddleware} = require('../middleware/authMiddleware');

const userRouter = express.Router()

//post all routes
userRouter.post("/register",registerAUser)
userRouter.post("/login",loginUser)


//get all routes
userRouter.get("/all-users",isAdmin,getAllUsers)


//update(put) all routes

userRouter.put("/update-profile",authMiddleware,updateUser)


//delete

userRouter.delete("/:_id",authMiddleware,isAdmin,deleteUser)
module.exports = userRouter
