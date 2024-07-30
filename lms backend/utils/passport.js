const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

passport.use(new GoogleStrategy({
  clientID: "597031288770-3bdm3op7gece61h50l2p4t6olqkuf2q9.apps.googleusercontent.com",
  clientSecret: "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",
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
        let newUser = await User.create({
          firstname: data.name,
          lastname: data.given_name,
          user_image: data.picture,
          email: data.email,
          role: "user",
        });
        return cb(null, newUser);
      }
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); // Assuming user.id uniquely identifies the user
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});