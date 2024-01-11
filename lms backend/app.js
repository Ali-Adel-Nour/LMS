const express = require('express');
const { notFound, handleError } = require('./middleware/errorHandler');
const app = express();
const dotenv = require('dotenv').config();
const dbConnect = require('./config/dbConfig');
const userRouter = require('./routes/userRoutes');

app.get("/", (req, res) => {
  res.send("Hello From LMS Job Portal Server");
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

// body-parser with built-in Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/v1/user", userRouter);

app.use(notFound);
app.use(handleError);

module.exports = app;
