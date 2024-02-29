const express = require('express');
const { notFound, handleError } = require('./middleware/errorHandler');
const app = express();
const dotenv = require('dotenv').config();
const dbConnect = require('./config/dbConfig');
const userRouter = require('./routes/userRoutes');
const googleRouter = require('./routes/googleRoutes');
const tutCatRouter = require('./routes/tutCatRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport')
const passportSetup = require("./utils/passport");

app.get("/", (req, res) => {
  res.send(`<a href="http://localhost:4000/google">Login with google</a>`);
});

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: "mysecret",
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 12 * 60 * 60
  })
}));


app.use(passport.initialize());
app.use(passport.session());
// body-parser with built-in Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/v1/user", userRouter);
app.use("/",googleRouter)
app.use("/api/v1/tutorial/category", tutCatRouter);
app.use(notFound);
app.use(handleError);

module.exports = app;
