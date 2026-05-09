const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env"),
  override: true,
});
require("@nomicfoundation/hardhat-toolbox");

const rawRpc = (process.env.ETHEREUM_RPC_URL || "").trim();
const rpcUrl = rawRpc.startsWith("http://") || rawRpc.startsWith("https://")
  ? rawRpc
  : rawRpc
    ? `https://eth-sepolia.g.alchemy.com/v2/${rawRpc}`
    : "";

const rawPk = (process.env.BACKEND_WALLET_PRIVATE_KEY || "").trim();
const normalizedPk = rawPk && !rawPk.startsWith("0x") ? `0x${rawPk}` : rawPk;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: rpcUrl,
      accounts: normalizedPk
        ? [normalizedPk]
        : [],
    },
  },
};
