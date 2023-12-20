const express = require('express');

const {registerAUser} = require('../controllers/userCont')
const userRouter = express.Router()


userRouter.post("/register",registerAUser)


module.exports = userRouter
