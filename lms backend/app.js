
const express = require('express');

const mongoose = require('mongoose');

const {notFound,handleError} = require('./middleware/errorHandler');

const app = express();

const dotenv = require('dotenv').config();

const userRouter = require('./routes/userRoutes');
const dbConnect = require('./config/dbConfig');



app.get("/", (req, res) => {
  res.send("Hello From LMS Job Portal Server")
})

// body-parser with built-in Express middleware

app.use(express.json())

app.use(express.urlencoded({extended:false}))
app.use("/api/user",userRouter)
app.use(notFound)
app.use(handleError)