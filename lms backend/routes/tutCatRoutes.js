const {postTutorialCategory} = require("../controllers/tutCatCtrl.js");

const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const tutCatRouter = require("express").Router();

tutCatRouter.post("/post",authMiddleware,isAdmin,postTutorialCategory);


module.exports = tutCatRouter;