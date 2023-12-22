const express = require('express');
const { notFound, handleError } = require('./middleware/errorHandler');
const app = express();
const dotenv = require('dotenv').config();
const dbConnect = require('./config/dbConfig');
const userRouter = require('./routes/userRoutes');

app.get("/", (req, res) => {
  res.send("Hello From LMS Job Portal Server");
});

// body-parser with built-in Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/v1/user", userRouter);

app.use(notFound);
app.use(handleError);

module.exports = app;
