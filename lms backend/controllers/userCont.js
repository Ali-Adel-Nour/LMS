const User = require('../models/userModel');

const asyncHandler = require('express-async-handler');

const generateToken = require('../config/jwtToken');
const validateMongodbId = require('../config/valditeMongodb');

const sendEmail = require('../controllers/emailCtrl');

const crypto = require('crypto');
//Create A User

const registerAUser = asyncHandler(async (req, res) => {
    //Get the email from req.body and find whether a user with this email exists or not

    const email = req.body.email;

    //Find the user with this email get from req.body

    const findUser = await User.findOne({ email: email });

    // create a user
    if (!findUser) {
        const createUser = await User.create(req.body);
        res.status(200).json({
            status: true,
            message: 'User create successfully',
            createUser,
        });
    } else {
        throw new Error('User Already Exists');
    }
});
//login a user

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    //check if user exists or not

    const findUser = await User.findOne({ email: email });

    if (findUser && (await findUser.isPasswordMatch(password))) {
        res.status(200).json({
            status: true,
            message: 'Logged In Successfully',
            token: generateToken(findUser?._id),
            role: findUser?.roles,
            username: findUser?.firstname + ' ' + findUser?.lastname,
            user_image: findUser?.user_image,
        });
    } else {
        throw new Error('Invalid Creditnails');
    }
});

//Get all users

const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const allUsers = await User.find();
        res.status(200).json({
            status: true,
            message: 'All Users Fetched successfully',
            allUsers,
        });
    } catch (err) {
        throw new Error(err);
    }
});

const getAUser = asyncHandler(async (req, res) => {
    const id = req.params;
    try {
        const getProfile = await User.findById(id);

        res.status(200).json({
            status: true,
            message: 'User Found',
            getProfile,
        });
    } catch (err) {
        throw new Error(err);
    }
});

//Update user profile

const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    // Validate MongoDB ID
    validateMongodbId(_id);

    try {
        const user = await User.findByIdAndUpdate(
            _id,
            req.body,
            { new: true } // Corrected position of the option
        );

        if (!user) {
            return res
                .status(404)
                .json({ status: false, message: 'User not found' });
        }

        res.status(200).json({
            status: true,
            message: 'Profile updated successfully',
            user,
        });
    } catch (err) {
        throw new Error(err);
    }
});

//delete a user

const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    //console.log('User ID to be deleted:', _id);
    validateMongodbId(_id);
    try {
        await User.findByIdAndDelete(_id);

        res.status(200).json({
            status: true,
            message: 'User Deleted successfully',
        });
    } catch (err) {
        throw new Error(err);
    }
});

//Block A user

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const block = await User.findByIdAndUpdate(id, {
            isBlocked: true,
            new: true,
        });
        res.status(200).json({
            status: true,
            message: 'User Block successfully',
        });
    } catch (err) {
        throw new Error(err);
    }
});

//Unblock A user

const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const unblock = await User.findByIdAndUpdate(id, {
            isBlocked: false,
            new: true,
        });
        res.status(200).json({
            status: true,
            message: 'User Unblocked successfully',
        });
    } catch (err) {
        throw new Error(err);
    }
});

const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongodbId(_id);
    try {
        const user = await User.findById(_id);
        if (user && password && (await user.isPasswordMatch(password))) {
            throw new Error('Please provide a new password insted of old one');
        } else {
            user.password = password;
            await user.save();
            console.log(user.password);
            res.status(200).json({
                status: true,
                message: 'Password updated successfully',
            });
        }
    } catch (err) {
        throw new Error(err);
    }
});

//forget Password token

const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) throw new Error('User not exist with this email');

    try {
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetLink = `https://localhost:4000/api/v1/user/reset-password/${token}`;
        const data = {
            to : email ,
        text: `Hey ${user.firstname + " " + user.lastname} `,
        subject: "Forget Password",
        html:resetLink,
        }
        sendEmail(data)
        res.status(200).json(resetLink);
    } catch (error) {
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error('Token Expired,Please try again');
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({
        status: true,
        message: 'Password Reset Successfully',
    });
});

module.exports = {
    registerAUser,
    loginUser,
    getAllUsers,
    getAUser,
    updateUser,
    deleteUser,
    blockUser,
    unblockUser,
    updatePassword,
    forgotPasswordToken,
    resetPassword
};
