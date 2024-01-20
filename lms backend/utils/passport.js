const passport = require('passport')
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/userModel")


passport.use(new GoogleStrategy(
{
  clientID: "597031288770-3bdm3op7gece61h50l2p4t6olqkuf2q9.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "/auth/google/callback",
  scope:["profile", "email"],
},
async function(accessToken,refreshToken,profile,cb){
  let data = profile?._json
  const user = await user.findOne([email,data.email])
  if(user){
    return cb(null,profile)
  }else{
    const newUser = await user.create({
      firstname: data.name,
      lastname:data.given_name,
      user_image:data.picute ,
      email:data ,
      role:"user",
    })
  }
    return await cb(null,profile);


})
)

passport.serializeUser((user,done)=>{
  done(null,user)
})

passport.deserializeUser((user,done)=>{
  done(null,user)
})