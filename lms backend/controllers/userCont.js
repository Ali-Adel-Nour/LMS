const User = require('../models/userModel');

//const RefreshToken = require ("../models/refreshTokenModel")

const  blackList = require("../models/blacklistModel")

const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

const { generateAccessToken, generateRefreshToken, verifyRefreshToken, removeRefreshToken } = require('../config/jwtToken');

const validateMongodbId = require('../config/valditeMongodb');

const sendEmail = require('../utils/email.js');

const { client } = require('../config/redisConfig');

const crypto = require('crypto');

const MAX_BLOCK_DURATION = 72
//Create A User

const registerAUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User Already Exists");
  }

  // Create a new user
  const newUser = await User.create(req.body);

  // Generate and send JWT
  const accessToken = generateAccessToken(newUser._id);
  const refreshToken = await generateRefreshToken(newUser);

  // Remove password from response
  const userResponse = newUser.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: userResponse,
    accessToken,
    refreshToken
  });
});

//login a user

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //check if user exists or not
try{
  const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }


    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user);

    // Set JWT as HTTP-Only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      status: true,
      message: 'Logged In Successfully',
      role: user?.roles,
      username: user?.firstname + ' ' + user?.lastname,
      user_image: user?.user_image,
      accessToken,
      refreshToken

    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Login failed',
      error: error.message
    });
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
  const { id } = req.params;
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


const updateUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user._id; // Get admin ID from auth middleware

  try {
    // Validate both IDs
    validateMongodbId(userId);
    validateMongodbId(adminId);

    // Check if admin exists and has admin role
    const admin = await User.findById(adminId);
    if (!admin || admin.roles !== 'admin') {
      return res.status(403).json({
        status: false,
        message: 'Not authorized to update user details'
      });
    }

    if(req.body.password ){
      return res.status(400).json({
        status: false,
        message: 'Password cannot be updated'
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,

      /*
      1-Update a document with new data from a request
      2-Track who made the change
      3-Ensure the updates are valid
   4- Get back the updated version of the document
      */
      {
        ...req.body,
        updatedBy: adminId
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Profile updated successfully',
      data: {
        user,
        updatedBy: admin.firstname + ' ' + admin.lastname
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});
//delete a user

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Validate MongoDB ID
    validateMongodbId(id);

 // Soft delete by updating active status
 const updatedUser = await User.findByIdAndUpdate(
  id,
  {
    active: false,
    //deactivatedAt: new Date(),
    //deactivatedBy: req.user._id // Track who deleted
  },
  { new: true }
);

    // Clear user from cache if using Redis
    const cacheKey = `user:${id}`;
    await client.del(cacheKey);

    res.status(200).json({
      status: true,
      message: 'User deactivated successfully',

    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
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

    if (!reason) {
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
  const { currentPassword, newPassword } = req.body;

  validateMongodbId(id);

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    // Check if both passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Both current password and new password are required'
      });
    }

    // Verify current password
    const isPasswordMatch = await user.isPasswordMatch(currentPassword);
    if (!isPasswordMatch) {
      return res.status(400).json({
        status: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error updating password',
      error: error.message
    });
  }
});

//forget Password token

const forgotPasswordToken = asyncHandler(async (req, res) => {

  try {
    const user = await User.findOne({ email:req.body.email })
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'No user found with this email'
      });
    }

    // Generate and save reset token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/user/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please use the following link to reset your password: ${resetUrl}\n\n
      If you did not request this email, please ignore it.`


    await sendEmail({
      email:user.email,
      subject:'Password change request recieve',
      message: message
    })
    res.status(200).json({
      status: true,
      message: 'Token sent to email'
    })


  } catch (error) {
    if (user) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
    return res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

const resetPassword = asyncHandler(async (req, res) => {

  const { token } = req.params;
  const { password } = req.body;


  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid password (minimum 6 characters).'
    });
  }


  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Password reset token is invalid or has expired.'
    });
  }


  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();




  const accessToken = generateAccessToken(user._id);
  res.status(200).json({
    success: true,
    accessToken: accessToken,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or request body
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return res.status(403).json({
      status: false,
      message: 'Refresh token not found'
    });
  }

  try {
    // Verify the refresh token and get user ID
    const userId = await verifyRefreshToken(token);

    if (!userId) {
      return res.status(403).json({
        status: false,
        message: 'Invalid refresh token'
      });
    }

    // Get the user to generate new tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(userId);

    // Generate new refresh token
    const newRefreshToken = await generateRefreshToken(user);

    // Set refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Send new access token to client
    res.status(200).json({
      status: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);

    // Clear cookie if token was invalid
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(401).json({
      status: false,
      message: 'Invalid or expired session. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
})

const logout = asyncHandler(async (req, res) => {
  try {
    // Get refresh token from cookie
    const token = req.cookies.refreshToken;

    // Get access token from Authorization header
    let accessToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }

    if (!token && !accessToken) {
      return res.status(200).json({
        status: true,
        message: "No active session found"
      });
    }

    // Blacklist access token if present
    if (accessToken) {
      try {
        // Verify access token to get user ID
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        // Add to blacklist with expiry time matching token expiry
        await blackList.create({
          token: accessToken,
          createdAt: new Date()
        });
      } catch (error) {
        console.warn('Invalid access token during logout:', error.message);
        // Continue with logout even if token is invalid
      }
    }

    // Remove refresh token from both Redis and MongoDB
    if (token) {
      // Use the new utility function that handles both Redis and MongoDB
      await removeRefreshToken(token);
    }

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    };

    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json({
      status: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: false,
      message: "Error during logout",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
const getPasswordHint = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || email.trim() === '') {
      return res.status(400).json({
        status: false,
        message: 'Please provide your email!'
      });
    }

    // Get user with passwordHint field
    const user = await User.findOne({ email }).select('+passwordHint');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'No user found with this email'
      });
    }

    if (!user.passwordHint) {
      return res.status(404).json({
        status: false,
        message: 'No password hint available'
      });
    }

    // Format the hint message based on structured hint
    let hintMessage = '';
    if (typeof user.passwordHint === 'object') {
      hintMessage = `Your password starts with: ${user.passwordHint.preview}\n`;
      hintMessage += `Length: ${user.passwordHint.length} characters\n`;
      hintMessage += `Contains: ${user.passwordHint.composition.join(', ')}`;
    } else {
      // If legacy hint format
      hintMessage = user.passwordHint;
    }

    // Send email with the hint
    const message = `
      Hello ${user.firstname},

      You (or someone) recently requested your LMS password hint.

      You recently requested a password hint:${hintMessage}

      If you still cannot remember your lms password, please reset your password or contact the support.

      If you did not request this hint, please ignore this email.
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Password Hint Request',
      message: message
    });

    res.status(200).json({
      status: true,
      message: 'Password hint sent to your email'
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error sending password hint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  registerAUser,
  loginUser,
  getAllUsers,
  getAUser,
  updateUser,
  refreshToken,
  logout,
  updateUserDetails,
  deleteUser,
  blockUser,
  getBlockHistory,
  unblockUser,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  getPasswordHint
};
