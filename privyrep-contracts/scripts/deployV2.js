const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting VerificationServiceV2 deployment...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // ============ 1. 读取现有合约地址 ============
  console.log("📂 Loading existing contract addresses...\n");

  const deploymentsDir = "./deployments";
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(`${hre.network.name}-`) && f.endsWith('.json'))
    .sort()
    .reverse(); // 最新的在前

  if (files.length === 0) {
    throw new Error(`No deployment files found for network: ${hre.network.name}`);
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), 'utf8')
  );

  console.log("  📄 Using deployment file:", files[0]);
  console.log("  ✅ ReputationScore:      ", latestDeployment.contracts.ReputationScore);
  console.log("  ✅ IdentityProofManager: ", latestDeployment.contracts.IdentityProofManager);
  console.log("  ✅ VerificationService (V1):", latestDeployment.contracts.VerificationService, "\n");

  const reputationScoreAddress = latestDeployment.contracts.ReputationScore;
  const identityProofManagerAddress = latestDeployment.contracts.IdentityProofManager;

  // ============ 2. 部署 VerificationServiceV2 ============
  console.log("📦 Deploying VerificationServiceV2...");
  const VerificationServiceV2 = await hre.ethers.getContractFactory("VerificationServiceV2");
  const verificationServiceV2 = await VerificationServiceV2.deploy(
    identityProofManagerAddress,
    reputationScoreAddress
  );
  await verificationServiceV2.waitForDeployment();
  const verificationServiceV2Address = await verificationServiceV2.getAddress();
  console.log("✅ VerificationServiceV2 deployed to:", verificationServiceV2Address, "\n");

  // ============ 3. 设置授权关系 ============
  console.log("🔐 Setting up authorizations...\n");

  // 获取现有合约实例
  const identityProofManager = await hre.ethers.getContractAt(
    "IdentityProofManager",
    identityProofManagerAddress
  );
  const reputationScore = await hre.ethers.getContractAt(
    "ReputationScore",
    reputationScoreAddress
  );

  // 3.1 授权 VerificationServiceV2 访问 IdentityProofManager
  console.log("  - Authorizing VerificationServiceV2 in IdentityProofManager...");
  const tx1 = await identityProofManager.addAuthorizedCaller(verificationServiceV2Address);
  await tx1.wait();
  console.log("  ✅ VerificationServiceV2 authorized in IdentityProofManager\n");

  // 3.2 授权 VerificationServiceV2 访问 ReputationScore
  console.log("  - Authorizing VerificationServiceV2 in ReputationScore...");
  const tx2 = await reputationScore.addAuthorizedCaller(verificationServiceV2Address);
  await tx2.wait();
  console.log("  ✅ VerificationServiceV2 authorized in ReputationScore\n");

  // ============ 4. 验证部署结果 ============
  console.log("🔍 Verifying deployment...\n");

  // 验证授权状态
  const isAuthorizedInIdentity = await identityProofManager.authorizedCallers(verificationServiceV2Address);
  const isAuthorizedInReputation = await reputationScore.authorizedCallers(verificationServiceV2Address);

  console.log("  - VerificationServiceV2 authorized in IdentityProofManager:", isAuthorizedInIdentity);
  console.log("  - VerificationServiceV2 authorized in ReputationScore:", isAuthorizedInReputation);

  // 验证合约地址
  const verifiedIdentityManager = await verificationServiceV2.identityManager();
  const verifiedReputationScore = await verificationServiceV2.reputationScore();

  console.log("  - VerificationServiceV2.identityManager():", verifiedIdentityManager);
  console.log("  - VerificationServiceV2.reputationScore():", verifiedReputationScore, "\n");

  // ============ 5. 输出部署摘要 ============
  console.log("=" .repeat(70));
  console.log("🎉 VerificationServiceV2 deployment completed successfully!");
  console.log("=" .repeat(70));
  console.log("\n📋 Deployment Summary:\n");
  console.log("  ReputationScore (V1):        ", reputationScoreAddress);
  console.log("  IdentityProofManager (V1):   ", identityProofManagerAddress);
  console.log("  VerificationService (V1):    ", latestDeployment.contracts.VerificationService);
  console.log("  VerificationServiceV2 (NEW): ", verificationServiceV2Address);
  console.log("\n✅ V2 Features:");
  console.log("  • Automatic Oracle callback mechanism");
  console.log("  • FHE.requestDecryption() integration");
  console.log("  • No manual completeVerification() needed");
  console.log("  • Inherits SepoliaConfig for Gateway/Oracle");
  console.log("\n💡 Next steps:");
  console.log("  1. Update frontend .env with V2 address");
  console.log("  2. Test requestVerification() on frontend");
  console.log("  3. Monitor Oracle callback execution");
  console.log("  4. Verify callbackCalled[taskId] === true");
  console.log("\n🔗 To verify V2 on Etherscan, run:");
  console.log(`  npx hardhat verify --network sepolia ${verificationServiceV2Address} ${identityProofManagerAddress} ${reputationScoreAddress}`);
  console.log("\n⚠️  Keep V1 address as backup for rollback:");
  console.log(`  V1: ${latestDeployment.contracts.VerificationService}`);
  console.log("\n");

  // 保存部署地址到文件
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    v2Deployment: true,
    contracts: {
      ReputationScore: reputationScoreAddress,
      IdentityProofManager: identityProofManagerAddress,
      VerificationService: latestDeployment.contracts.VerificationService, // V1 (备份)
      VerificationServiceV2: verificationServiceV2Address // V2 (新)
    },
    notes: "V2 adds Oracle auto-callback. V1 kept as backup for rollback."
  };

  const filename = `${deploymentsDir}/${hre.network.name}-v2-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
