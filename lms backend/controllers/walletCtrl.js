const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../config/jwtToken");
const {
  normalizeWalletAddress,
  isValidWalletAddress,
  buildWalletNonceMessage,
  verifyWalletSignature,
} = require("../services/web3Service");

const requestWalletNonce = asyncHandler(async (req, res) => {
  const { walletAddress, email } = req.body;

  if (!walletAddress) {
    return res.status(400).json({
      status: false,
      message: "walletAddress is required",
    });
  }

  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({
      status: false,
      message: "Invalid wallet address",
    });
  }

  const normalizedWallet = normalizeWalletAddress(walletAddress);
  let user = await User.findOne({ walletAddress: normalizedWallet });

  if (email) {
    const emailUser = await User.findOne({ email });
    if (!emailUser) {
      return res.status(404).json({
        status: false,
        message: "User not found for this email",
      });
    }

    if (user && user._id.toString() !== emailUser._id.toString()) {
      return res.status(400).json({
        status: false,
        message: "This wallet is already linked to another account",
      });
    }

    if (emailUser.walletAddress && emailUser.walletAddress !== normalizedWallet) {
      return res.status(400).json({
        status: false,
        message: "This account is already linked to another wallet address",
      });
    }

    user = emailUser;
    user.walletAddress = normalizedWallet;
  }

  let isNewWalletUser = false;
  if (!user) {
    isNewWalletUser = true;
    const walletSuffix = normalizedWallet.slice(-6);
    user = await User.create({
      authProvider: "wallet",
      firstname: "Wallet",
      lastname: `User-${walletSuffix}`,
      profession: "wallet-user",
      walletAddress: normalizedWallet,
    });
  }

  const signatureNonce = crypto.randomBytes(16).toString("hex");

  user.signatureNonce = signatureNonce;
  await user.save();

  res.status(200).json({
    status: true,
    message: "Wallet nonce generated successfully",
    isNewWalletUser,
    userId: user._id,
    walletAddress: user.walletAddress,
    nonce: signatureNonce,
    signMessage: buildWalletNonceMessage(signatureNonce),
  });
});

const verifyWalletLogin = asyncHandler(async (req, res) => {
  const { walletAddress, signature } = req.body;

  if (!walletAddress || !signature) {
    return res.status(400).json({
      status: false,
      message: "walletAddress and signature are required",
    });
  }

  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({
      status: false,
      message: "Invalid wallet address",
    });
  }

  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const user = await User.findOne({ walletAddress: normalizedWallet });

  if (!user) {
    return res.status(404).json({
      status: false,
      message: "No account linked with this wallet address",
    });
  }

  if (!user.signatureNonce) {
    return res.status(400).json({
      status: false,
      message: "Nonce missing. Request a new nonce first.",
    });
  }

  const signMessage = buildWalletNonceMessage(user.signatureNonce);
  const isValidSignature = verifyWalletSignature({
    message: signMessage,
    signature,
    walletAddress: normalizedWallet,
  });

  if (!isValidSignature) {
    return res.status(401).json({
      status: false,
      message: "Invalid wallet signature",
    });
  }

  user.signatureNonce = crypto.randomBytes(16).toString("hex");
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    status: true,
    message: "Wallet login successful",
    userId: user?._id,
    authProvider: user?.authProvider,
    role: user?.roles,
    username: `${user?.firstname} ${user?.lastname}`,
    user_image: user?.user_image,
    walletAddress: user?.walletAddress,
    accessToken,
    refreshToken,
  });
});

const completeWalletProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { firstname, lastname, profession, email, mobile, user_image } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: false,
      message: "User not found",
    });
  }

  if (email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
      return res.status(400).json({
        status: false,
        message: "Email already used by another account",
      });
    }
    user.email = email;
  }

  if (mobile) {
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile && existingMobile._id.toString() !== userId.toString()) {
      return res.status(400).json({
        status: false,
        message: "Mobile already used by another account",
      });
    }
    user.mobile = mobile;
  }

  if (firstname) user.firstname = firstname;
  if (lastname) user.lastname = lastname;
  if (profession) user.profession = profession;
  if (user_image) user.user_image = user_image;

  await user.save();

  return res.status(200).json({
    status: true,
    message: "Wallet profile updated successfully",
    user: {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      profession: user.profession,
      email: user.email,
      mobile: user.mobile,
      walletAddress: user.walletAddress,
      authProvider: user.authProvider,
    },
  });
});

module.exports = {
  requestWalletNonce,
  verifyWalletLogin,
  completeWalletProfile,
};
