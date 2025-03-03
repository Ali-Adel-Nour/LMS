const User = require('../models/userModel');

const asyncHandler = require('express-async-handler');

const generateToken = require('../config/jwtToken');
const validateMongodbId = require('../config/valditeMongodb');

const sendEmail = require('../controllers/emailCtrl');

const {client} = require('../config/redisConfig');

const crypto = require('crypto');

const MAX_BLOCK_DURATION = 72
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
    let { page, size } = req.query;


    page = parseInt(page) || 1
    size = parseInt(size) || 10


    page = Math.max(page, 1)
    size = Math.max(size, 1)


    const cacheKey = `docs:page${page}:size${size}`;


    const cachedUsers = await client.get(cacheKey);
    if (cachedUsers) {
      return res.status(200).json({
        status: true,
        page,
        size,
        message: 'Users Fetched from Cache',
        data: JSON.parse(cachedUsers)
      });
    }


    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const allUsers = await User.find().lean().limit(limit).skip(skip);


    await client.setEx(cacheKey, 3600, JSON.stringify(allUsers)); // 1 hour expiration

    res.status(200).json({
      status: true,
      page,
      size,
      message: 'All Users Fetched successfully',
      data: allUsers,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

const getAUser = asyncHandler(async (req, res) => {
  const {id} = req.params;
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
  const { id } = req.user;

  // Validate MongoDB ID
  validateMongodbId(id);

  try {
    const user = await User.findByIdAndUpdate(
      id,
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
  const { id } = req.params;
  //console.log('User ID to be deleted:', _id);
  validateMongodbId(id);
  try {
    await User.findByIdAndDelete(id);

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
  const { reason, blockDurationHours = 0 } = req.body;

  // Validate inputs
  validateMongodbId(id);

  const duration = Math.max(0, Math.min(parseInt(blockDurationHours) || 0, MAX_BLOCK_DURATION));

  try {
    const [user, admin] = await Promise.all([
      User.findById(id),
      User.findById(req.user._id)
    ]);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    if (user.isBlocked) {
      return res.status(400).json({
        status: false,
        message: 'User is already blocked'
      });
    }

    if(!reason){
      return res.status(400).json({
        status: false,
        message: 'Please provide a valid reason for blocking'
      });
    }

    const blockDetails = {
      reason,
      blockedBy: admin._id,
      blockedAt: new Date(),
      blockExpires: duration > 0
        ? new Date(Date.now() + duration * 60 * 60 * 1000)
        : null
    };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
        blockDetails,
        $push: {
          blockHistory: {
            ...blockDetails,
            blockDuration: duration,
            unblockedAt: null
          }
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: true,
      message: 'User blocked successfully',
      data: {
        user: updatedUser,
        blockDetails: updatedUser.blockDetails
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});



const getBlockHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { page = 1, size = 10 } = req.query;


  if (!id) {
    return res.status(400).json({ status: false, message: 'User ID is required' });
  }

  try {

    validateMongodbId(id);

    page = Math.max(parseInt(page) || 1);
    size = Math.min(parseInt(size) || 10, 100);

    const user = await User.findById(id).select('blockHistory').lean();
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    const blockHistory = user.blockHistory || [];
    const total = blockHistory.length;
    const totalPages = Math.ceil(total / size);
    const startIndex = (page - 1) * size;
    const endIndex = page * size;

    if (startIndex > total) {
      return res.status(400).json({ status: false, message: 'Page number out of range' });
    }

    const paginatedHistory = blockHistory
      .sort((a, b) => b.blockedAt - a.blockedAt)
      .slice(startIndex, endIndex);

    res.status(200).json({
      status: true,
      data: paginatedHistory,
      pagination: {
        total,
        page,
        size,
        totalPages,
        hasNextPage: endIndex < total,
        hasPrevPage: startIndex > 0
      }
    });

  } catch (error) {
    const statusCode = error.name === 'CastError' ? 400 : 500;
    res.status(statusCode).json({
      status: false,
      message: error.message
    });
  }
});

//Unblock A user

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  try {

    validateMongodbId(id);
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    if (!user.isBlocked) {
      return res.status(400).json({
        status: false,
        message: 'User is not blocked'
      });
    }

    // Update block history
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
        blockDetails: null,
        $set: {
          'blockHistory.$[elem].unblockedAt': new Date(),
          'blockHistory.$[elem].unblockedBy': adminId
        }
      },
      {
        new: true,
        arrayFilters: [{ 'elem.unblockedAt': null }]
      }
    );

    res.status(200).json({
      status: true,
      message: 'User unblocked successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});
const updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { password } = req.body;
  validateMongodbId(id);
  try {
    const user = await User.findById(id);
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
      to: email,
      text: `Hey ${user.firstname + " " + user.lastname} `,
      subject: "Forget Password",
      html: resetLink,
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
  getBlockHistory,
  unblockUser,
  updatePassword,
  forgotPasswordToken,
  resetPassword
};