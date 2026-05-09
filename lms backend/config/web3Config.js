const { JsonRpcProvider, Wallet } = require("ethers");

const rpcUrl = process.env.ETHEREUM_RPC_URL || "";
const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY || "";

let provider = null;
let signer = null;

if (rpcUrl) {
  provider = new JsonRpcProvider(rpcUrl);
}

if (provider && privateKey) {
  signer = new Wallet(privateKey, provider);
}

module.exports = {
  provider,
  signer,
  contracts: {
    certificate: process.env.CERTIFICATE_CONTRACT_ADDRESS || "",
    token: process.env.REWARD_TOKEN_CONTRACT_ADDRESS || "",
    payment: process.env.PAYMENT_CONTRACT_ADDRESS || "",
    verification: process.env.VERIFICATION_CONTRACT_ADDRESS || "",
    usdc: process.env.USDC_CONTRACT_ADDRESS || "",
  },
};
