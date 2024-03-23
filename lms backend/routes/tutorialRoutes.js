const {postTutorial,getATutorial,updateATutorial,deleteATutorial,getAllTutorials} = require('../controllers/tutorialCtrl');

const {authMiddleware,isAdmin} = require('../middleware/authMiddleware');

const tutorialRouter = require('express').Router();

tutorialRouter.post("/",authMiddleware,isAdmin,postTutorial)
tutorialRouter.get("/:type/:slug",authMiddleware,isAdmin,getATutorial)
tutorialRouter.put("/:id",authMiddleware,isAdmin,updateATutorial)
tutorialRouter.delete("/:id",authMiddleware,isAdmin,deleteATutorial)
tutorialRouter.get("/all",authMiddleware,isAdmin,getAllTutorials)

module.exports = tutorialRouter