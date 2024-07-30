const { subscribe, unsubscribe } = require('../controllers/newsLetterCtrl')
const newsLetterRouter = require('express').Router();
const rateLimter = require("../middleware/rateLimiter")

newsLetterRouter.post("/", rateLimter, subscribe);
newsLetterRouter.delete("/:id", rateLimter, unsubscribe);


module.exports = newsLetterRouter