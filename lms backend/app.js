
const express = require('express');

const mongoose = require('mongoose');

const {notFound,handlerError} = require('./middleware/errorHandler');

const app = express();

const dotenv = require('dotenv').config();


const dbConnect = require('./config/dbConfig');

app.use(notFound)
app.use(handlerError)
app.get("/", (req, res) => {
  res.send("Hello From LMS Job Portal Server")
})