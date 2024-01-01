const express = require('express');

const {registerAUser,
  loginUser,
  getAllUsers,
  getAUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser

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


//all (put) routes

userRouter.put("/update-profile",authMiddleware,updateUser)

userRouter.put("/block/:id",authMiddleware,isAdmin,blockUser)

userRouter.put("/unblock/:id",authMiddleware,isAdmin,unblockUser)

//Delete

userRouter.delete("/:_id",authMiddleware,isAdmin,deleteUser)




//Unblock User
module.exports = userRouter
