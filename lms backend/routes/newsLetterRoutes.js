const {subscribe,unsubscribe} = require('../controllers/newsLetterCtrl')

const newsLetterRouter = require('express').Router();


newsLetterRouter.post("/",subscribe)
newsLetterRouter.delete("/:id",unsubscribe)


module.exports = newsLetterRouter