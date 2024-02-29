const {postTutorialCategory} = require("../controllers/tutCatCtrl.js");

const tutCatRouter = require("express").Router();

tutCatRouter.post("/post",authMiddleware,isAdmin,postTutorialCategory);


module.exports = tutCatRouter;