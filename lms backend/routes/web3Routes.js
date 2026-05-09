const express = require("express");
const {
  mintCourseCertificate,
  mintRewardTokens,
  registerCompletionOnChain,
  verifyCompletionOnChain,
  issueCertificate,
  mintRewardToUser,
  createPaymentIntent,
  confirmPayment,
  verifyCompletion,
  getMyWeb3Records,
} = require("../controllers/web3Ctrl");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const rateLimter = require("../middleware/rateLimiter");

const web3Router = express.Router();

web3Router.post("/certificate/mint", authMiddleware, isAdmin, rateLimter, mintCourseCertificate);
web3Router.post("/certificate/issue", authMiddleware, isAdmin, rateLimter, issueCertificate);
web3Router.post("/rewards/mint", authMiddleware, isAdmin, rateLimter, mintRewardTokens);
web3Router.post("/reward/mint", authMiddleware, isAdmin, rateLimter, mintRewardToUser);
web3Router.post("/verification/register", authMiddleware, isAdmin, rateLimter, registerCompletionOnChain);
web3Router.get("/verification/:walletAddress/:courseId", rateLimter, verifyCompletionOnChain);
web3Router.post("/payment/intent", authMiddleware, rateLimter, createPaymentIntent);
web3Router.post("/payment/confirm", authMiddleware, rateLimter, confirmPayment);
web3Router.get("/verify/:walletAddress/:courseCode", rateLimter, verifyCompletion);
web3Router.get("/my-records", authMiddleware, rateLimter, getMyWeb3Records);

module.exports = web3Router;
