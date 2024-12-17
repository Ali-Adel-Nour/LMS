const rateLimit = require('express-rate-limit')


const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: 20,
  message: 'You have exceeded the 20 requests in 24 hrs limit!',
  standardHeaders: true,
  legacyHeaders: false,
});




// const rateLimit = require('express-rate-limit');

// const createRateLimiter = (windowHours = 24, maxRequests = 20) => {
//   return rateLimit({
//     windowMs: windowHours * 60 * 60 * 1000, // Convert hours to milliseconds
//     max: maxRequests,
//     message: `You have exceeded ${maxRequests} requests in ${windowHours} hours limit!`,
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
// };

// // Create different limiters
// const strictLimiter = createRateLimiter(24, 20);  // 20 requests per 24 hours
// const mediumLimiter = createRateLimiter(24, 50);  // 50 requests per 24 hours
// const lightLimiter = createRateLimiter(24, 100);  // 100 requests per 24 hours

// module.exports = {
//   createRateLimiter,
//   strictLimiter,
//   mediumLimiter,
//   lightLimiter
// };


module.exports = rateLimiterUsingThirdParty;