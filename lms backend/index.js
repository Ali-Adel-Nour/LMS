const express = require('express');

const app = express();

const dotenv = require('dotenv').config();

const PORT = process.env.PORT || 5000;

const dbConnect = require('./config/dbConfig');



app.get("/", (req, res) => {
  res.send("Hello From LMS Job Portal Server")
})

app.listen(PORT,()=>{
  console.log(`Server is Running on port ${PORT}`);
});