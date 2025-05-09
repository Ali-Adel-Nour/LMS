const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret:process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:4000/auth/google/callback",
  scope: ["profile", "email"]
},
  async function (accessToken, refreshToken, profile, cb) {
    try {
      let data = profile._json;
      let user = await User.findOne({ email: data.email });

      if (user) {
        return cb(null, user);

      } else {

        const randomPassword = crypto.randomBytes(20).toString('hex');

        // Create new user with required fields
        let newUser = await User.create({
          firstname: data.name || data.given_name || 'Google',
          lastname: data.family_name || data.given_name || 'User',
          user_image: data.picture,
          email: data.email,
          roles: "user",

          profession: "Not specified",
          mobile: `google_${Date.now().toString()}`,
          password: randomPassword
        });

        return cb(null, newUser);
      }
    } catch (err) {
      console.error('Google auth error:', err);
      return cb(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
})