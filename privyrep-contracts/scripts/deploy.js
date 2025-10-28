const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting PrivyRep contracts deployment...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // ============ 1. 部署 ReputationScore ============
  console.log("📦 Deploying ReputationScore...");
  const ReputationScore = await hre.ethers.getContractFactory("ReputationScore");
  const reputationScore = await ReputationScore.deploy();
  await reputationScore.waitForDeployment();
  const reputationScoreAddress = await reputationScore.getAddress();
  console.log("✅ ReputationScore deployed to:", reputationScoreAddress, "\n");

  // ============ 2. 部署 IdentityProofManager ============
  console.log("📦 Deploying IdentityProofManager...");
  const IdentityProofManager = await hre.ethers.getContractFactory("IdentityProofManager");
  const identityProofManager = await IdentityProofManager.deploy();
  await identityProofManager.waitForDeployment();
  const identityProofManagerAddress = await identityProofManager.getAddress();
  console.log("✅ IdentityProofManager deployed to:", identityProofManagerAddress, "\n");

  // ============ 3. 部署 VerificationService ============
  console.log("📦 Deploying VerificationService...");
  const VerificationService = await hre.ethers.getContractFactory("VerificationService");
  const verificationService = await VerificationService.deploy(
    identityProofManagerAddress,
    reputationScoreAddress
  );
  await verificationService.waitForDeployment();
  const verificationServiceAddress = await verificationService.getAddress();
  console.log("✅ VerificationService deployed to:", verificationServiceAddress, "\n");

  // ============ 4. 设置授权关系 ============
  console.log("🔐 Setting up authorizations...\n");

  // 4.1 授权 VerificationService 访问 IdentityProofManager
  console.log("  - Authorizing VerificationService in IdentityProofManager...");
  const tx1 = await identityProofManager.addAuthorizedCaller(verificationServiceAddress);
  await tx1.wait();
  console.log("  ✅ VerificationService authorized in IdentityProofManager\n");

  // 4.2 授权 VerificationService 访问 ReputationScore
  console.log("  - Authorizing VerificationService in ReputationScore...");
  const tx2 = await reputationScore.addAuthorizedCaller(verificationServiceAddress);
  await tx2.wait();
  console.log("  ✅ VerificationService authorized in ReputationScore\n");

  // ============ 5. 验证部署结果 ============
  console.log("🔍 Verifying deployment...\n");

  // 验证授权状态
  const isAuthorizedInIdentity = await identityProofManager.authorizedCallers(verificationServiceAddress);
  const isAuthorizedInReputation = await reputationScore.authorizedCallers(verificationServiceAddress);

  console.log("  - VerificationService authorized in IdentityProofManager:", isAuthorizedInIdentity);
  console.log("  - VerificationService authorized in ReputationScore:", isAuthorizedInReputation);

  // 验证合约地址
  const verifiedIdentityManager = await verificationService.identityManager();
  const verifiedReputationScore = await verificationService.reputationScore();

  console.log("  - VerificationService.identityManager():", verifiedIdentityManager);
  console.log("  - VerificationService.reputationScore():", verifiedReputationScore, "\n");

  // ============ 6. 输出部署摘要 ============
  console.log("=" .repeat(60));
  console.log("🎉 Deployment completed successfully!");
  console.log("=" .repeat(60));
  console.log("\n📋 Deployment Summary:\n");
  console.log("  ReputationScore:        ", reputationScoreAddress);
  console.log("  IdentityProofManager:   ", identityProofManagerAddress);
  console.log("  VerificationService:    ", verificationServiceAddress);
  console.log("\n💡 Next steps:");
  console.log("  1. Save these addresses to your frontend .env file");
  console.log("  2. Verify contracts on Etherscan (if on testnet/mainnet)");
  console.log("  3. Test the contracts using the scripts in scripts/interact.js");
  console.log("\n🔗 To verify on Etherscan, run:");
  console.log(`  npx hardhat verify --network sepolia ${reputationScoreAddress}`);
  console.log(`  npx hardhat verify --network sepolia ${identityProofManagerAddress}`);
  console.log(`  npx hardhat verify --network sepolia ${verificationServiceAddress} ${identityProofManagerAddress} ${reputationScoreAddress}`);
  console.log("\n");

  // 保存部署地址到文件
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ReputationScore: reputationScoreAddress,
      IdentityProofManager: identityProofManagerAddress,
      VerificationService: verificationServiceAddress
    }
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${deploymentsDir}/${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
