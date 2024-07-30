const NewsLetter = require('../models/newsLetterMod');

const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');


const subscribe = asyncHandler(async (req, res) => {

  try {

    const newEmail = await NewsLetter.create(req.body)
    res.status(200).json({ status: true, message: 'Subscribed To NewsLetter' })

  } catch (err) {
    throw new Error(err);
  }

})

const unsubscribe = asyncHandler(async (req, res) => {

  try {

    const { id } = req.params;
    validateMongodbId(id);

    const removeEmail = await NewsLetter.findByIdAndDelete(id)
    res.status(200).json({ status: true, message: 'Unsubscribed To NewsLetter' })

  } catch (err) {
    throw new Error(err);
  }



})


module.exports = { subscribe, unsubscribe };