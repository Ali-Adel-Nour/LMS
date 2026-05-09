const express = require("express");
const {
  requestWalletNonce,
  verifyWalletLogin,
  completeWalletProfile,
} = require("../controllers/walletCtrl");
const { authMiddleware } = require("../middleware/authMiddleware");
const rateLimter = require("../middleware/rateLimiter");

const walletRouter = express.Router();

walletRouter.post("/nonce", rateLimter, requestWalletNonce);
walletRouter.post("/verify", rateLimter, verifyWalletLogin);
walletRouter.patch("/complete-profile", authMiddleware, rateLimter, completeWalletProfile);

module.exports = walletRouter;
