const User = require('../models/userModel')

const jwt = require('jsonwebtoken')

const asyncHandler = require('express-async-handler')

const validateMongodbId = require('../config/valditeMongodb')



const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in cookies first
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Fallback to Bearer token in header
  else if (req?.headers?.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new Error("Not authorized, please login again");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded?.id).select('-password');

    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new Error("Not authorized, token failed");
  }
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


const autoUnblock = async (req, res, next) => {
  if (req.method === 'GET' && req.path.includes('/users/')) {
    await User.updateMany(
      {
        isBlocked: true,
        'blockDetails.blockExpires': { $lte: new Date() }
      },
      {
        $set: { isBlocked: false },
        $unset: { blockDetails: 1 }
      }
    );
  }
  next();
};

const isAdmin = checkRole(ROLES.ADMIN);
const isInstructor = checkRole(ROLES.INSTRUCTOR);

module.exports = { authMiddleware, isAdmin, isInstructor,isBoth,autoUnblock }