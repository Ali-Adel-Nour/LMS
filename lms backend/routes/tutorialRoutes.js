const {postTutorial} = require('../controllers/tutorialCtrl');

const {authMiddleware,isAdmin} = require('../middleware/authMiddleware');

const tutorialRouter = require('express').Router();

tutorialRouter.post("/",authMiddleware,isAdmin,postTutorial)


module.exports = tutorialRouter