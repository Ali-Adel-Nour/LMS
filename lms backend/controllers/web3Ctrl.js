const {
  Contract,
  isAddress,
  parseUnits,
  keccak256,
  toUtf8Bytes,
} = require("ethers");
const asyncHandler = require("express-async-handler");
const { signer, contracts, provider } = require("../config/web3Config");
const User = require("../models/userModel");
const Course = require("../models/courseModel");
const Web3Record = require("../models/web3RecordModel");

const certificateAbi = [
  "function mintCertificate(address student,string courseId,uint256 score,string metadataURI) external returns (uint256)",
  "event CertificateMinted(uint256 indexed tokenId,address indexed student,string courseId,uint256 score,string tokenURI)",
];

const tokenAbi = [
  "function mintReward(address to,uint256 amount,string reason) external",
  "event RewardMinted(address indexed to,uint256 amount,string reason)",
];

const verificationAbi = [
  "function registerCompletion(address student,string courseId,uint256 score,uint256 certificateTokenId,bytes32 recordHash) external",
  "function isCompleted(address student,string courseId) external view returns (bool)",
  "function completions(address,bytes32) external view returns (bool completed,uint256 score,uint256 completedAt,uint256 certificateTokenId,bytes32 recordHash)",
];

const paymentAbi = [
  "function payForCourse(string courseId,uint256 amount) external",
  "event CoursePaid(address indexed student,string courseId,uint256 amount,uint256 paidAt)",
];

const ensureSigner = () => {
  if (!signer) {
    throw new Error("Web3 signer not configured. Set ETHEREUM_RPC_URL and BACKEND_WALLET_PRIVATE_KEY.");
  }
};

const getCertificateContract = () => {
  if (!contracts.certificate) {
    throw new Error("CERTIFICATE_CONTRACT_ADDRESS is not configured");
  }
  ensureSigner();
  return new Contract(contracts.certificate, certificateAbi, signer);
};

const getTokenContract = () => {
  if (!contracts.token) {
    throw new Error("REWARD_TOKEN_CONTRACT_ADDRESS is not configured");
  }
  ensureSigner();
  return new Contract(contracts.token, tokenAbi, signer);
};

const getVerificationContract = () => {
  if (!contracts.verification) {
    throw new Error("VERIFICATION_CONTRACT_ADDRESS is not configured");
  }
  ensureSigner();
  return new Contract(contracts.verification, verificationAbi, signer);
};

const getPaymentContract = () => {
  if (!contracts.payment) {
    throw new Error("PAYMENT_CONTRACT_ADDRESS is not configured");
  }
  ensureSigner();
  return new Contract(contracts.payment, paymentAbi, signer);
};

const getChainId = async () => {
  const activeProvider = provider || signer?.provider;
  if (!activeProvider) {
    return null;
  }

  const network = await activeProvider.getNetwork();
  return Number(network.chainId);
};

const mintCourseCertificate = asyncHandler(async (req, res) => {
  const { studentWalletAddress, courseId, score, metadataURI, userId } = req.body;

  if (!studentWalletAddress || !courseId || score === undefined || !metadataURI) {
    return res.status(400).json({
      status: false,
      message: "studentWalletAddress, courseId, score and metadataURI are required",
    });
  }

  if (!isAddress(studentWalletAddress)) {
    return res.status(400).json({
      status: false,
      message: "Invalid student wallet address",
    });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      status: false,
      message: "Course not found",
    });
  }

  const contract = getCertificateContract();
  const tx = await contract.mintCertificate(studentWalletAddress, String(courseId), Number(score), String(metadataURI));
  const receipt = await tx.wait();

  let tokenId = null;
  if (receipt && receipt.logs && receipt.logs.length > 0) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "CertificateMinted") {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (error) {
      }
    }
  }

  let user = null;
  if (userId) {
    user = await User.findById(userId);
  }

  const chainId = await getChainId();
  await Web3Record.create({
    user: user ? user._id : null,
    course: course._id,
    courseCode: course.slug,
    walletAddress: studentWalletAddress,
    type: "certificate_issued",
    status: "confirmed",
    txHash: receipt.hash,
    contractAddress: contracts.certificate,
    score: Number(score),
    tokenId,
    metadataURI,
    chainId,
    payload: req.body,
  });

  return res.status(200).json({
    status: true,
    message: "Course certificate minted successfully",
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    tokenId,
    contractAddress: contracts.certificate,
  });
});

const mintRewardTokens = asyncHandler(async (req, res) => {
  const { toWalletAddress, amount, reason, userId } = req.body;

  if (!toWalletAddress || !amount || !reason) {
    return res.status(400).json({
      status: false,
      message: "toWalletAddress, amount and reason are required",
    });
  }

  if (!isAddress(toWalletAddress)) {
    return res.status(400).json({
      status: false,
      message: "Invalid recipient wallet address",
    });
  }

  const contract = getTokenContract();
  const tx = await contract.mintReward(toWalletAddress, parseUnits(String(amount), 18), String(reason));
  const receipt = await tx.wait();

  let user = null;
  if (userId) {
    user = await User.findById(userId);
  }

  const chainId = await getChainId();
  await Web3Record.create({
    user: user ? user._id : null,
    walletAddress: toWalletAddress,
    type: "reward_minted",
    status: "confirmed",
    txHash: receipt.hash,
    contractAddress: contracts.token,
    amount: parseUnits(String(amount), 18).toString(),
    reason: String(reason),
    chainId,
    payload: req.body,
  });

  return res.status(200).json({
    status: true,
    message: "Reward tokens minted successfully",
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    contractAddress: contracts.token,
  });
});

const registerCompletionOnChain = asyncHandler(async (req, res) => {
  const { studentWalletAddress, courseId, score, certificateTokenId, recordHash } = req.body;

  if (!studentWalletAddress || !courseId || score === undefined || certificateTokenId === undefined) {
    return res.status(400).json({
      status: false,
      message: "studentWalletAddress, courseId, score and certificateTokenId are required",
    });
  }

  if (!isAddress(studentWalletAddress)) {
    return res.status(400).json({
      status: false,
      message: "Invalid student wallet address",
    });
  }

  const safeRecordHash = recordHash || keccak256(toUtf8Bytes(`${studentWalletAddress.toLowerCase()}|${courseId}|${score}|${certificateTokenId}`));
  const contract = getVerificationContract();

  const tx = await contract.registerCompletion(
    studentWalletAddress,
    String(courseId),
    Number(score),
    Number(certificateTokenId),
    safeRecordHash
  );
  const receipt = await tx.wait();

  const course = await Course.findOne({ $or: [{ _id: courseId }, { slug: String(courseId) }] });

  const chainId = await getChainId();
  await Web3Record.create({
    course: course ? course._id : null,
    courseCode: course ? course.slug : String(courseId),
    walletAddress: studentWalletAddress,
    type: "verification_registered",
    status: "confirmed",
    txHash: receipt.hash,
    contractAddress: contracts.verification,
    score: Number(score),
    tokenId: String(certificateTokenId),
    recordHash: safeRecordHash,
    chainId,
    payload: req.body,
  });

  return res.status(200).json({
    status: true,
    message: "Completion registered on chain",
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    courseId,
    recordHash: safeRecordHash,
    contractAddress: contracts.verification,
  });
});

const verifyCompletionOnChain = asyncHandler(async (req, res) => {
  const { walletAddress, courseId } = req.params;

  if (!walletAddress || !courseId) {
    return res.status(400).json({
      status: false,
      message: "walletAddress and courseId are required",
    });
  }

  if (!isAddress(walletAddress)) {
    return res.status(400).json({
      status: false,
      message: "Invalid wallet address",
    });
  }

  if (!contracts.verification) {
    return res.status(500).json({
      status: false,
      message: "VERIFICATION_CONTRACT_ADDRESS is not configured",
    });
  }

  const readContract = new Contract(contracts.verification, verificationAbi, provider || signer);
  const completed = await readContract.isCompleted(walletAddress, String(courseId));

  const courseHash = keccak256(toUtf8Bytes(String(courseId)));
  const completion = await readContract.completions(walletAddress, courseHash);

  return res.status(200).json({
    status: true,
    message: "Verification fetched successfully",
    verified: Boolean(completed),
    data: {
      walletAddress,
      courseId,
      score: completion.score ? completion.score.toString() : "0",
      completedAt: completion.completedAt ? completion.completedAt.toString() : "0",
      certificateTokenId: completion.certificateTokenId ? completion.certificateTokenId.toString() : "0",
      recordHash: completion.recordHash || null,
      contractAddress: contracts.verification,
    },
  });
});

const issueCertificate = asyncHandler(async (req, res) => {
  const { userId, courseId, score, metadataURI } = req.body;

  if (!userId || !courseId || score === undefined || !metadataURI) {
    return res.status(400).json({
      status: false,
      message: "userId, courseId, score and metadataURI are required",
    });
  }

  const user = await User.findById(userId);
  if (!user || !user.walletAddress) {
    return res.status(400).json({
      status: false,
      message: "User not found or wallet address missing",
    });
  }

  req.body.studentWalletAddress = user.walletAddress;
  return mintCourseCertificate(req, res, () => {});
});

const mintRewardToUser = asyncHandler(async (req, res) => {
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason) {
    return res.status(400).json({
      status: false,
      message: "userId, amount and reason are required",
    });
  }

  const user = await User.findById(userId);
  if (!user || !user.walletAddress) {
    return res.status(400).json({
      status: false,
      message: "User not found or wallet address missing",
    });
  }

  req.body.toWalletAddress = user.walletAddress;
  return mintRewardTokens(req, res, () => {});
});

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { courseId, amountUSDC } = req.body;
  const userId = req.user._id;

  if (!courseId || !amountUSDC) {
    return res.status(400).json({
      status: false,
      message: "courseId and amountUSDC are required",
    });
  }

  if (!contracts.payment || !contracts.usdc) {
    return res.status(500).json({
      status: false,
      message: "PAYMENT_CONTRACT_ADDRESS and USDC_CONTRACT_ADDRESS must be configured",
    });
  }

  const user = await User.findById(userId);
  if (!user || !user.walletAddress) {
    return res.status(400).json({
      status: false,
      message: "User wallet address is required. Link wallet first.",
    });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      status: false,
      message: "Course not found",
    });
  }

  const amountInBaseUnits = parseUnits(String(amountUSDC), 6).toString();
  const chainId = await getChainId();

  const intent = await Web3Record.create({
    user: user._id,
    course: course._id,
    courseCode: course.slug,
    walletAddress: user.walletAddress,
    type: "payment_intent",
    status: "pending",
    amountUSDC: String(amountUSDC),
    amount: amountInBaseUnits,
    contractAddress: contracts.payment,
    chainId,
    payload: req.body,
  });

  return res.status(200).json({
    status: true,
    message: "Payment intent created successfully",
    paymentIntentId: intent._id,
    walletAddress: user.walletAddress,
    courseCode: course.slug,
    amountUSDC: String(amountUSDC),
    amountInBaseUnits,
    contracts: {
      payment: contracts.payment,
      usdc: contracts.usdc,
    },
    abi: {
      payment: paymentAbi,
      usdc: [
        "function approve(address spender,uint256 amount) external returns (bool)",
        "function allowance(address owner,address spender) external view returns (uint256)",
      ],
    },
  });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, txHash } = req.body;
  const userId = req.user._id;

  if (!paymentIntentId || !txHash) {
    return res.status(400).json({
      status: false,
      message: "paymentIntentId and txHash are required",
    });
  }

  const intent = await Web3Record.findById(paymentIntentId);
  if (!intent || intent.type !== "payment_intent") {
    return res.status(404).json({
      status: false,
      message: "Payment intent not found",
    });
  }

  if (intent.user && intent.user.toString() !== userId.toString()) {
    return res.status(403).json({
      status: false,
      message: "You are not authorized to confirm this payment",
    });
  }

  const activeProvider = provider || signer?.provider;
  if (!activeProvider) {
    return res.status(500).json({
      status: false,
      message: "Web3 provider is not configured",
    });
  }

  const receipt = await activeProvider.getTransactionReceipt(txHash);
  if (!receipt) {
    return res.status(404).json({
      status: false,
      message: "Transaction not mined yet",
    });
  }

  const status = receipt.status === 1 ? "confirmed" : "failed";

  intent.txHash = txHash;
  intent.status = status;
  intent.chainId = Number(receipt.chainId || intent.chainId || 0);
  await intent.save();

  const confirmationRecord = await Web3Record.create({
    user: intent.user,
    course: intent.course,
    courseCode: intent.courseCode,
    walletAddress: intent.walletAddress,
    type: "payment_confirmed",
    status,
    txHash,
    paymentIntentId: intent._id,
    contractAddress: contracts.payment,
    amountUSDC: intent.amountUSDC,
    amount: intent.amount,
    chainId: intent.chainId,
    payload: {
      paymentIntentId,
      txHash,
      receipt,
    },
  });

  return res.status(200).json({
    status: true,
    message: status === "confirmed" ? "Payment confirmed successfully" : "Payment transaction failed",
    paymentIntent: intent,
    confirmationRecord,
  });
});

const verifyCompletion = asyncHandler(async (req, res) => {
  req.params.courseId = req.params.courseCode;
  return verifyCompletionOnChain(req, res);
});

const getMyWeb3Records = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const records = await Web3Record.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json({
    status: true,
    message: "Web3 records fetched successfully",
    count: records.length,
    records,
  });
});

module.exports = {
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
};
