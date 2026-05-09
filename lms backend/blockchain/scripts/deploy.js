const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Certificate = await hre.ethers.getContractFactory("CourseCertificateNFT");
  const certificate = await Certificate.deploy();
  await certificate.waitForDeployment();

  const RewardToken = await hre.ethers.getContractFactory("LMSToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();

  const Verification = await hre.ethers.getContractFactory("VerificationRegistry");
  const verification = await Verification.deploy();
  await verification.waitForDeployment();

  console.log("CourseCertificateNFT:", await certificate.getAddress());
  console.log("LMSToken:", await rewardToken.getAddress());
  console.log("VerificationRegistry:", await verification.getAddress());
  console.log("Deploy CoursePaymentHandler separately after setting USDC + treasury addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
