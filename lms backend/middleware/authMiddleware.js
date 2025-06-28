const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');
const blackList = require('../models/blacklistModel');
const { verifyRefreshToken } = require('../config/jwtToken');


// Main authentication middleware - validates access token
const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // Get access token from Authorization header (preferred method)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: false,
      message: "Authentication required. Please login."
    });
  }

  try {
    // First check if token is blacklisted
    const isBlacklisted = await blackList.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        status: false,
        message: "Session expired. Please log in again."
      });
    }

    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      // Check if block has expired
      if (user.blockDetails && user.blockDetails.blockExpires && new Date(user.blockDetails.blockExpires) <= new Date()) {
        // Auto-unblock user
        user.isBlocked = false;
        user.blockDetails = undefined;
        await user.save();
      } else {
        // User is still blocked
        let message = "Your account has been blocked";
        if (user.blockDetails && user.blockDetails.reason) {
          message += ` for the following reason: ${user.blockDetails.reason}`;
        }

        if (user.blockDetails && user.blockDetails.blockExpires) {
          const blockEnd = new Date(user.blockDetails.blockExpires);
          message += `. Block expires on ${blockEnd.toLocaleString()}`;
        }

        return res.status(403).json({
          status: false,
          message
        });
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: false,
        message: "Invalid token. Please login again."
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: "Token expired. Please refresh your session."
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({
        status: false,
        message: "Authentication failed due to server error.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Middleware to check if the user is blacklisted
const verifyBlacklist = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(); // No token to check, proceed
  }

  // Check if token is blacklisted
  const isBlacklisted = await blackList.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      status: false,
      message: "Session expired. Please log in again."
    });
  }

  next();
});
// const isAdmin = asyncHandler(async (req, res, next) => {
//   const { email } = req.user
//   const user = await User.findOne({ email: email })
//   if (!user) {
//     return res.status(404).json({
//       success: false,
//       message: "User not found"
//     });
//   } else if (user.roles !== "admin") {
//     throw new Error("You are not an Admin")
//   } else {
//     next()
//   }
// })


// const isInstructor = asyncHandler(async (req, res, next) => {
//   const { email } = req.user
//   const isInstructor = await User.findOne({ email: email })
//   if (isInstructor.roles !== "instructor") {
//     throw new Error("You are not an Instructor")
//   } else {
//     next()
//   }
// })

const ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  ISBOTH: 'isboth'
};

const checkRole = (role) => {
  return asyncHandler(async (req, res, next) => {
    const { email } = req.user;

    const user = await User.findOne({ email }).select('roles').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure roles is an array and check if role exists
    if (!user.roles || !user.roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You must be a ${role} to access this resource`
      });
    }

    next();
  });
};


const isBoth = asyncHandler(async (req, res, next) => {
  const { email } = req.user;

  const user = await User.findOne({ email }).select('roles').lean();
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Ensure user has both 'admin' and 'instructor' roles
  const hasBothRoles = user.roles && user.roles.includes(ROLES.ADMIN) && user.roles.includes(ROLES.INSTRUCTOR);

  if (!hasBothRoles) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You must be both an admin and an instructor."
    });
  }

  next();
});


// Middleware to automatically unblock users when their block duration expires
const autoUnblock = asyncHandler(async (req, res, next) => {
  try {
    // Only run this middleware for GET requests to user-related endpoints
    if (req.method === 'GET' && req.path.includes('/users/')) {
      const result = await User.updateMany(
        {
          isBlocked: true,
          'blockDetails.blockExpires': { $lte: new Date() }
        },
        {
          $set: { isBlocked: false },
          $unset: { blockDetails: 1 },
          $push: {
            'blockHistory.$[elem].unblockedAt': new Date(),
            'blockHistory.$[elem].unblockedBy': null,
            'blockHistory.$[elem].unblockReason': 'Auto-unblocked due to expiration'
          }
        },
        {
          arrayFilters: [{ 'elem.unblockedAt': null }]
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Auto-unblocked ${result.modifiedCount} users`);
      }
    }
    next();
  } catch (error) {
    console.error('Error in autoUnblock middleware:', error);
    next(); // Continue even if there's an error
  }
});

const isAdmin = checkRole(ROLES.ADMIN);
const isInstructor = checkRole(ROLES.INSTRUCTOR);

// Optional middleware that validates refresh token from cookie
// Useful for routes that specifically need to validate the refresh token
const validateRefreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      status: false,
      message: "Refresh token not found. Please log in again."
    });
  }

  try {


    // Verify token
    const userId = await verifyRefreshToken(token);

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Attach user to request
    req.user = user;
    // Also attach the refresh token for convenience
    req.refreshToken = token;

    next();
  } catch (error) {
    // Clear the invalid refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(401).json({
      status: false,
      message: "Invalid refresh token. Please log in again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  authMiddleware,
  isAdmin,
  isInstructor,
  isBoth,
  autoUnblock,
  verifyBlacklist,
  validateRefreshToken
}
