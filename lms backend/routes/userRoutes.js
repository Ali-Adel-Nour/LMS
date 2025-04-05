const express = require('express');

const {
    registerAUser,
    loginUser,
    getAllUsers,
    getAUser,
    updateUser,
    updateUserDetails,
    deleteUser,
    blockUser,
    getBlockHistory,
    unblockUser,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    logout,
    refreshToken
} = require('../controllers/userCont');

const { isAdmin, authMiddleware, autoUnblock, verifyBlacklist, validateRefreshToken } = require('../middleware/authMiddleware');

const rateLimter = require("../middleware/rateLimiter")

const userRouter = express.Router();

//Post all routes
userRouter.post('/register', rateLimter, registerAUser);
userRouter.post('/login', rateLimter, loginUser);
userRouter.post('/forgot-password', rateLimter, forgotPasswordToken);
userRouter.post('/logout', rateLimter, verifyBlacklist, logout);
userRouter.post('/refresh-token', rateLimter, refreshToken);


//Get all routes


userRouter.get('/all-users', authMiddleware, isAdmin, rateLimter, getAllUsers);


userRouter.get('/block-history/:id', authMiddleware, isAdmin, rateLimter, getBlockHistory);

userRouter.get('/:id', authMiddleware, rateLimter, getAUser);



//all (put) routes


userRouter.put('/update-profile/:id', authMiddleware, rateLimter, updateUser);


userRouter.put('/block/:id', authMiddleware, isAdmin, rateLimter,autoUnblock, blockUser);

userRouter.put('/unblock/:id', authMiddleware, isAdmin, rateLimter, unblockUser);



//Patch Routes
userRouter.patch('/update-password/:id', authMiddleware, rateLimter, updatePassword);
userRouter.patch('/reset-password/:token', rateLimter, resetPassword);
userRouter.patch('/update-user-profile/:userId',authMiddleware,isAdmin,rateLimter,updateUserDetails)


//Delete

userRouter.delete('/:id', authMiddleware, isAdmin, rateLimter, deleteUser);


module.exports = userRouter;