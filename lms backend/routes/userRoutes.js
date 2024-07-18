const express = require('express');

const {
    registerAUser,
    loginUser,
    getAllUsers,
    getAUser,
    updateUser,
    deleteUser,
    blockUser,
    unblockUser,
    updatePassword,
    resetPassword,
    forgotPasswordToken,
} = require('../controllers/userCont');

const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');

const rateLimter = require("../middleware/rateLimiter")

const userRouter = express.Router();

//Post all routes
userRouter.post('/register', rateLimter, registerAUser);
userRouter.post('/login', rateLimter, loginUser);
userRouter.post('/forgot-password', rateLimter, forgotPasswordToken);


//Get all routes
userRouter.get('/all-users', authMiddleware, isAdmin,rateLimter, getAllUsers);

userRouter.get('/:_id', authMiddleware,rateLimter, getAUser);

//all (put) routes


userRouter.put('/update-profile', authMiddleware, rateLimter, updateUser);
userRouter.put('/block/:id', authMiddleware, isAdmin, rateLimter, blockUser);

userRouter.put('/unblock/:id', authMiddleware, isAdmin, rateLimter, unblockUser);

userRouter.put('/update-password', authMiddleware, rateLimter, updatePassword);

userRouter.put('/reset-password/:token', rateLimter, resetPassword);


//Delete

userRouter.delete('/:_id', authMiddleware, isAdmin, rateLimter, deleteUser);


module.exports = userRouter;
