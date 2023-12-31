const express = require('express');

const {registerAUser,
  loginUser,
  getAllUsers,
  getAUser,
  updateUser,
  deleteUser,

} = require('../controllers/userCont')

const {isAdmin,authMiddleware} = require('../middleware/authMiddleware');

const userRouter = express.Router()

//Post all routes
userRouter.post("/register",registerAUser)
userRouter.post("/login",loginUser)


//Get all routes
userRouter.get("/all-users",isAdmin,getAllUsers)


//Get A user
userRouter.get("/:_id",authMiddleware,getAUser)


//update(put) all routes

userRouter.put("/update-profile",authMiddleware,updateUser)


//Delete

userRouter.delete("/:_id",authMiddleware,isAdmin,deleteUser)
module.exports = userRouter
