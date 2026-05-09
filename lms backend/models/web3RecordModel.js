const mongoose = require("mongoose");

const web3RecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    courseCode: {
      type: String,
      default: null,
      index: true,
    },
    walletAddress: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "certificate_issued",
        "reward_minted",
        "payment_intent",
        "payment_confirmed",
        "verification_registered",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
      index: true,
    },
    txHash: {
      type: String,
      default: null,
      index: true,
    },
    paymentIntentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Web3Record",
      default: null,
      index: true,
    },
    contractAddress: {
      type: String,
      default: null,
    },
    amount: {
      type: String,
      default: null,
    },
    amountUSDC: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      default: null,
    },
    tokenId: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
    metadataURI: {
      type: String,
      default: null,
    },
    recordHash: {
      type: String,
      default: null,
    },
    chainId: {
      type: Number,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

web3RecordSchema.index({ user: 1, type: 1, createdAt: -1 });
web3RecordSchema.index({ walletAddress: 1, courseCode: 1, type: 1 });

module.exports = mongoose.model("Web3Record", web3RecordSchema);
