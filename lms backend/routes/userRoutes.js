const express = require('express');

const {registerAUser,loginUser,getAllUsers} = require('../controllers/userCont')

const userRouter = express.Router()


userRouter.post("/register",registerAUser)
userRouter.post("/login",loginUser)

userRouter.get("/all-users",getAllUsers)

//all get routes



module.exports = userRouter
