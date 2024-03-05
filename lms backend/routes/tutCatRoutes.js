const {
    postTutorialCategory,
    getAllCategory,
    getATutorial,
    DeleteATutorialCat,
    updateTutorialCat,
} = require('../controllers/tutCatCtrl.js');

const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const tutCatRouter = require('express').Router();

tutCatRouter.post('/post', authMiddleware, isAdmin, postTutorialCategory);
tutCatRouter.get('/all', authMiddleware, isAdmin, getAllCategory);
tutCatRouter.get('/:id', authMiddleware, isAdmin, getATutorial);
tutCatRouter.put('/:id', authMiddleware, isAdmin, updateTutorialCat);
tutCatRouter.delete('/:id', authMiddleware, isAdmin, DeleteATutorialCat);

module.exports = tutCatRouter;
