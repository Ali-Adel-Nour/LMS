const passport = require('passport')
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/userModel")


passport.use(new GoogleStrategy(

))

passport.serializeUser((user,done)=>{
  done(null,user)
})