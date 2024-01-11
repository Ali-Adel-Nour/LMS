const googleRouter = require("express").Router()
const passport = require("passport")

const {generateToken} = require("../config/jwtToken")

const User = require("../models/userModel")

const expressAsyncHandler = require("express-async-handler")

googleRouter.get(
  "/login/success",
  expressAsyncHandler(async (req, res) => {

  })
)
  googleRouter.get(
    "/login/failed",
  expressAsyncHandler(async (req, res) => {

  })
  )


  googleRouter.get(
    "/google",
  expressAsyncHandler(async (req, res) => {
      await passport.authenticate("google",["profile", "email"])
  })
  )


  googleRouter.get(
    "/auth/google/callback",
  expressAsyncHandler(async (req, res) => {
      await passport.authenticate("google",["profile", "email"])
      successRedirect:"/login/success"
      failureRedirct: "/login/failed"
  })

  )


  googleRouter.get(
    "/logout",
  expressAsyncHandler(async (req, res) => {
      res.logOut()
      res.redirect("/")
  })

  )

  module.exports = googleRouter

