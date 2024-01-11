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

const userRouter = express.Router();

//Post all routes
userRouter.post('/register', registerAUser);
userRouter.post('/login', loginUser);
userRouter.post('/forgot-password',forgotPasswordToken);


//Get all routes
userRouter.get('/all-users',  authMiddleware,isAdmin, getAllUsers);

userRouter.get('/:_id', authMiddleware, getAUser);

//all (put) routes

userRouter.put('/update-profile', authMiddleware, updateUser);

userRouter.put('/block/:id', authMiddleware, isAdmin, blockUser);

userRouter.put('/unblock/:id', authMiddleware, isAdmin, unblockUser);

userRouter.put('/update-password', authMiddleware, updatePassword);

userRouter.put('/reset-password/:token',  resetPassword);


//Delete

userRouter.delete('/:_id', authMiddleware, isAdmin, deleteUser);

//Unblock User
module.exports = userRouter;
