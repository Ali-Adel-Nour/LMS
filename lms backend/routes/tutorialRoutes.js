const { postTutorial, getATutorial, updateATutorial, deleteATutorial, getAllTutorials } = require('../controllers/tutorialCtrl');

const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

const rateLimter = require("../middleware/rateLimiter")

const tutorialRouter = require('express').Router();

tutorialRouter.post("/", authMiddleware, isAdmin, rateLimter, postTutorial);
tutorialRouter.get("/:type/:slug", authMiddleware, isAdmin, rateLimter, getATutorial);
tutorialRouter.put("/:id", authMiddleware, isAdmin, rateLimter, updateATutorial);
tutorialRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteATutorial);
tutorialRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllTutorials);

module.exports = tutorialRouter