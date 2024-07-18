const {
    postTutorialCategory,
    getAllCategory,
    getATutorial,
    DeleteATutorialCat,
    updateTutorialCat,
} = require('../controllers/tutCatCtrl.js');

const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const tutCatRouter = require('express').Router();

tutCatRouter.post('/post', authMiddleware, isAdmin, rateLimter, postTutorialCategory);
tutCatRouter.get('/all', authMiddleware, isAdmin, rateLimter, getAllCategory);
tutCatRouter.get('/:id', authMiddleware, isAdmin, rateLimter, getATutorial);
tutCatRouter.put('/:id', authMiddleware, isAdmin, rateLimter, updateTutorialCat);
tutCatRouter.delete('/:id', authMiddleware, isAdmin, rateLimter, DeleteATutorialCat);

module.exports = tutCatRouter;
