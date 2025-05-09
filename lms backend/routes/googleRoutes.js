const googleRouter = require("express").Router()
const passport = require("passport")

const { generateAccessToken } = require("../config/jwtToken")

const User = require("../models/userModel")

const expressAsyncHandler = require("express-async-handler")

googleRouter.get(
  "/login/success",
  expressAsyncHandler(async (req, res) => {
    if (req.user) {
      const findUser = await User.findOne({ email: req.user.email })
      if (findUser) {
        res.status(200).json({
          status: true,
          message: 'Logged In Successfully',
          token:generateAccessToken(findUser?._id),
          role: findUser?.roles,
          username: findUser?.firstname + ' ' + findUser?.lastname,
          user_image: findUser?.user_image,
          from: "google"
        })
      }
    } else {
      throw Error("Something went wrong")
    }
  })
)
googleRouter.get(
  "/login/failed",
  expressAsyncHandler(async (req, res) => {
    res.status(401).json({ status: false, message: "Login Failed" })
  })
)


googleRouter.get(
  "/google",
  passport.authenticate("google", ["profile", "email"])

)


googleRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/login/success",
    failureRedirect: "/login/failed",
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

