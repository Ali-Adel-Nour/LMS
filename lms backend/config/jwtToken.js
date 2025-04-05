const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/refreshTokenModel');
const { getRedisClient } = require('./redisConfig');
const createError = require('http-errors');

// Generate short-lived access token (1 hour)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Generate long-lived refresh token (7 days)
const generateRefreshToken = async (user) => {
  try {
    // Get Redis client
    const client = await getRedisClient();

    // Create token with user ID as audience
    const refreshToken = jwt.sign(
      {},
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
        audience: user._id.toString()
      }
    );

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store in MongoDB for persistence
    const tokenDoc = await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt
    });

    // Store in Redis for quick lookups
    // Key format: refresh_token:userId
    await client.setEx(
      `refresh_token:${user._id}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      refreshToken
    );

    // Check if this user has too many active tokens
    const MAX_USER_TOKENS = 5;
    const tokenCount = await RefreshToken.countDocuments({ user: user._id });

    // Delete oldest tokens if over limit
    if (tokenCount > MAX_USER_TOKENS) {
      const tokensToDelete = await RefreshToken.find({ user: user._id })
        .sort({ createdAt: 1 })
        .limit(tokenCount - MAX_USER_TOKENS);

      // Delete from MongoDB
      for (const token of tokensToDelete) {
        await RefreshToken.deleteOne({ _id: token._id });
        // Also delete from Redis if it exists
        await client.del(`refresh_token:${user._id}`);
      }
    }

    return refreshToken;
  } catch (err) {
    console.error('Error generating refresh token:', err);
    throw new Error('Failed to generate refresh token');
  }
};

// Verify refresh token and return userId if valid
const verifyRefreshToken = async (refreshToken) => {
  try {
    // First verify JWT signature
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = payload.aud;

    // Get Redis client
    const client = await getRedisClient();

    // Check Redis cache first (faster)
    const cachedToken = await client.get(`refresh_token:${userId}`);
    if (cachedToken === refreshToken) {
      return userId;
    }

    // Fallback to database check
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: userId,
      expiresAt: { $gt: new Date() }
    });

    if (!storedToken) {
      throw createError.Unauthorized('Invalid refresh token');
    }

    // If found in DB but not in Redis, add to Redis for future lookups
    await client.setEx(
      `refresh_token:${userId}`,
      Math.floor((storedToken.expiresAt - new Date()) / 1000), // Remaining time in seconds
      refreshToken
    );

    return userId;
  } catch (err) {
    console.error('Refresh token verification error:', err);
    throw createError.Unauthorized('Invalid refresh token');
  }
};

// Remove a refresh token (used during logout)
const removeRefreshToken = async (refreshToken) => {
  try {
    // First verify JWT signature to get userId
    let userId;
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      userId = payload.aud;
    } catch (err) {
      // If token is invalid, still try to remove it from DB
      console.warn('Invalid token during removal attempt:', err.message);
    }

    // Get Redis client
    const client = await getRedisClient();

    // Remove from MongoDB
    const result = await RefreshToken.deleteOne({ token: refreshToken });

    // Remove from Redis if userId is available
    if (userId) {
      await client.del(`refresh_token:${userId}`);
    }

    return result.deletedCount > 0;
  } catch (err) {
    console.error('Error removing refresh token:', err);
    throw new Error('Failed to remove refresh token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  removeRefreshToken
};
