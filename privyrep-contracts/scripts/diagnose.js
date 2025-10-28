/**
 * 诊断合约和 FHE 配置问题
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 PrivyRep 合约诊断工具");
  console.log("═══════════════════════════════════════════════════════\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 检查地址: ${deployer.address}\n`);

  // 合约地址
  const addresses = {
    IdentityProofManager: "0x1492770cbc14c29d308828ef95424E1975374cD2",
    ReputationScore: "0x16d91ec4F00cc05B2f8d3358e90ab0f4AC0db430",
    VerificationServiceV2: "0x92846236576E783D6404232934AFc1C5914eEFb7"
  };

  console.log("📋 合约地址:");
  Object.entries(addresses).forEach(([name, addr]) => {
    console.log(`   ${name}: ${addr}`);
  });
  console.log("");

  try {
    // 1. 检查 IdentityProofManager
    console.log("1️⃣  检查 IdentityProofManager");
    console.log("─────────────────────────────────────────────────────");

    const IdentityProofManager = await hre.ethers.getContractAt(
      "IdentityProofManager",
      addresses.IdentityProofManager
    );

    const owner = await IdentityProofManager.owner();
    console.log(`   Owner: ${owner}`);
    console.log(`   Is deployer owner? ${owner === deployer.address ? "✅ YES" : "❌ NO"}`);

    const isRegistered = await IdentityProofManager.isRegistered(deployer.address);
    console.log(`   Is deployer registered? ${isRegistered ? "✅ YES" : "❌ NO"}`);

    const hasRegistered = await IdentityProofManager.hasRegistered(deployer.address);
    console.log(`   Has deployer registered? ${hasRegistered ? "✅ YES" : "❌ NO"}`);

    // 2. 检查 VerificationServiceV2 授权
    console.log("\n2️⃣  检查 VerificationServiceV2 授权");
    console.log("─────────────────────────────────────────────────────");

    const v2Authorized = await IdentityProofManager.authorizedCallers(addresses.VerificationServiceV2);
    console.log(`   V2 is authorized? ${v2Authorized ? "✅ YES" : "❌ NO"}`);

    // 3. 检查 ReputationScore
    console.log("\n3️⃣  检查 ReputationScore");
    console.log("─────────────────────────────────────────────────────");

    const ReputationScore = await hre.ethers.getContractAt(
      "ReputationScore",
      addresses.ReputationScore
    );

    const scoreOwner = await ReputationScore.owner();
    console.log(`   Owner: ${scoreOwner}`);

    const score = await ReputationScore.getScore(deployer.address);
    console.log(`   Deployer's score: ${score.toString()}`);

    const v2AuthorizedInScore = await ReputationScore.authorizedCallers(addresses.VerificationServiceV2);
    console.log(`   V2 authorized in ReputationScore? ${v2AuthorizedInScore ? "✅ YES" : "❌ NO"}`);

    // 4. 检查 VerificationServiceV2
    console.log("\n4️⃣  检查 VerificationServiceV2");
    console.log("─────────────────────────────────────────────────────");

    const VerificationServiceV2 = await hre.ethers.getContractAt(
      "VerificationServiceV2",
      addresses.VerificationServiceV2
    );

    const v2Owner = await VerificationServiceV2.owner();
    console.log(`   Owner: ${v2Owner}`);

    const taskCounter = await VerificationServiceV2.taskCounter();
    console.log(`   Task counter: ${taskCounter.toString()}`);

    const identityManager = await VerificationServiceV2.identityManager();
    console.log(`   IdentityManager address: ${identityManager}`);
    console.log(`   Matches deployment? ${identityManager === addresses.IdentityProofManager ? "✅ YES" : "❌ NO"}`);

    const reputationScore = await VerificationServiceV2.reputationScore();
    console.log(`   ReputationScore address: ${reputationScore}`);
    console.log(`   Matches deployment? ${reputationScore === addresses.ReputationScore ? "✅ YES" : "❌ NO"}`);

    // 5. 检查用户余额
    console.log("\n5️⃣  检查账户余额");
    console.log("─────────────────────────────────────────────────────");

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    console.log(`   Deployer balance: ${balanceInEth} ETH`);

    if (parseFloat(balanceInEth) < 0.01) {
      console.log(`   ⚠️  WARNING: Low balance! Get Sepolia ETH from faucet.`);
    } else {
      console.log(`   ✅ Sufficient balance`);
    }

    // 总结
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📊 诊断总结\n");

    const checks = [
      { name: "合约部署", passed: true },
      { name: "V2 授权 (IdentityProofManager)", passed: v2Authorized },
      { name: "V2 授权 (ReputationScore)", passed: v2AuthorizedInScore },
      { name: "合约地址配置", passed: identityManager === addresses.IdentityProofManager && reputationScore === addresses.ReputationScore },
      { name: "账户余额充足", passed: parseFloat(balanceInEth) >= 0.01 }
    ];

    checks.forEach(check => {
      console.log(`   ${check.passed ? "✅" : "❌"} ${check.name}`);
    });

    const allPassed = checks.every(c => c.passed);
    console.log("");
    if (allPassed) {
      console.log("✅ 所有检查通过！合约配置正常。\n");
      console.log("💡 如果前端仍然报错，问题可能在于：");
      console.log("   1. FHE SDK 加载失败（检查浏览器控制台）");
      console.log("   2. 网络连接问题（无法连接 Zama Gateway）");
      console.log("   3. MetaMask 网络配置不正确");
      console.log("   4. FHE 加密数据格式不正确\n");
    } else {
      console.log("❌ 发现配置问题！请先修复上述问题。\n");
    }

  } catch (error) {
    console.error("\n❌ 诊断过程中出错:", error.message);
    console.error("   完整错误:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
