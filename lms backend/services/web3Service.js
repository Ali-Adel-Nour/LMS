const { isAddress, verifyMessage, utils } = require("ethers");

const normalizeWalletAddress = (walletAddress = "") => {
  return String(walletAddress).trim().toLowerCase();
};

const isValidWalletAddress = (walletAddress = "") => {
  return isAddress(walletAddress);
};

const buildWalletNonceMessage = (nonce) => {
  return [
    "LMS Wallet Login",
    `Nonce: ${nonce}`,
    "Only sign this message if you trust this app.",
  ].join("\n");
};

const verifyWalletSignature = ({ message, signature, walletAddress }) => {
  const recoveredAddress = verifyMessage(message, signature);
  return normalizeWalletAddress(recoveredAddress) === normalizeWalletAddress(walletAddress);
};

module.exports = {
  normalizeWalletAddress,
  isValidWalletAddress,
  buildWalletNonceMessage,
  verifyWalletSignature,
};
