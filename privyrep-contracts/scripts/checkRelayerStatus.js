const hre = require("hardhat");

/**
 * 检测 Zama Relayer 是否在线
 * 通过多种方法综合判断
 */
async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 Zama Relayer Status Checker");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Checking from account:", deployer.address);
  console.log("🌐 Network:", hre.network.name);
  console.log("");

  let score = 0;
  const maxScore = 4;

  // ============ 测试 1: 检查 FHE SDK 是否可访问 ============
  console.log("1️⃣ Testing FHE SDK CDN accessibility...");
  try {
    const https = require('https');
    const testUrl = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js';

    await new Promise((resolve, reject) => {
      https.get(testUrl, (res) => {
        if (res.statusCode === 200) {
          console.log("   ✅ FHE SDK CDN is accessible");
          score++;
          resolve();
        } else {
          console.log("   ❌ FHE SDK CDN returned:", res.statusCode);
          reject();
        }
      }).on('error', reject);
    });
  } catch (error) {
    console.log("   ❌ FHE SDK CDN is not accessible");
  }

  // ============ 测试 2: 检查已部署的 V2 合约 ============
  console.log("\n2️⃣ Testing V2 contract deployment...");
  try {
    const V2_ADDRESS = "0xFA88cd14F09c7a78C37048cA118C3568c9324768";
    const code = await hre.ethers.provider.getCode(V2_ADDRESS);

    if (code !== "0x") {
      console.log("   ✅ VerificationServiceV2 is deployed");
      console.log("   📍 Address:", V2_ADDRESS);
      console.log("   📏 Code size:", code.length, "bytes");
      score++;
    } else {
      console.log("   ❌ VerificationServiceV2 not found");
    }
  } catch (error) {
    console.log("   ❌ Error checking V2 contract:", error.message);
  }

  // ============ 测试 3: 检查 Gateway 合约活动 ============
  console.log("\n3️⃣ Checking Gateway contract activity...");
  try {
    // Zama Gateway 地址（Sepolia）
    const GATEWAY_ADDRESSES = [
      "0x3ee97Fb04625EDD0d3c4CE44eb3B3a8F4c607b93",
      "0x33347831500f1e73f102414faf8a9f3f63cce4c5",
    ];

    let gatewayFound = false;

    for (const gatewayAddr of GATEWAY_ADDRESSES) {
      try {
        const code = await hre.ethers.provider.getCode(gatewayAddr);

        if (code !== "0x") {
          console.log("   📍 Found Gateway at:", gatewayAddr);

          // 检查最近的活动
          const currentBlock = await hre.ethers.provider.getBlockNumber();
          const fromBlock = currentBlock - 1000; // 最近 1000 个区块

          const filter = {
            address: gatewayAddr,
            fromBlock: fromBlock,
            toBlock: currentBlock
          };

          const logs = await hre.ethers.provider.getLogs(filter);

          if (logs.length > 0) {
            console.log("   ✅ Gateway has recent activity:", logs.length, "events in last 1000 blocks");

            const latestLog = logs[logs.length - 1];
            const block = await hre.ethers.provider.getBlock(latestLog.blockNumber);
            const timeAgo = Math.floor((Date.now() / 1000) - Number(block.timestamp));
            const minutesAgo = Math.floor(timeAgo / 60);

            console.log("   ⏰ Latest activity:", minutesAgo, "minutes ago");

            if (timeAgo < 3600) { // 1 小时内
              console.log("   🟢 Gateway is ACTIVE (activity within last hour)");
              score += 2; // Gateway 活跃是最重要的指标
              gatewayFound = true;
            } else {
              console.log("   🟡 Gateway last active", Math.floor(timeAgo / 3600), "hours ago");
              score += 1;
              gatewayFound = true;
            }
          } else {
            console.log("   ⚠️  No recent activity on this Gateway");
          }
          break;
        }
      } catch (err) {
        // 尝试下一个地址
        continue;
      }
    }

    if (!gatewayFound) {
      console.log("   ❌ Could not find active Gateway contract");
    }

  } catch (error) {
    console.log("   ❌ Error checking Gateway:", error.message);
  }

  // ============ 最终判断 ============
  console.log("\n" + "=".repeat(70));
  console.log("📊 RELAYER STATUS ASSESSMENT");
  console.log("=".repeat(70));
  console.log("Score:", score, "/", maxScore);
  console.log("");

  if (score >= 3) {
    console.log("Status: 🟢 OPERATIONAL");
    console.log("Confidence: HIGH");
    console.log("");
    console.log("✅ Recommendation: Deploy V2 and use Oracle callback");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Switch to V2:");
    console.log("     echo \"VITE_USE_V2=true\" > privyrep-frontend/.env");
    console.log("");
    console.log("  2. Stop oracleService.js (not needed for V2)");
    console.log("");
    console.log("  3. Test verification request and wait for Oracle callback");

  } else if (score >= 1) {
    console.log("Status: 🟡 UNCERTAIN");
    console.log("Confidence: MEDIUM");
    console.log("");
    console.log("⚠️  Recommendation: Wait or use V1 as backup");
    console.log("");
    console.log("Possible issues:");
    console.log("  • Gateway may be operational but not processing requests");
    console.log("  • Network connectivity issues");
    console.log("  • Relayer maintenance in progress");
    console.log("");
    console.log("Suggested actions:");
    console.log("  1. Check Zama official channels:");
    console.log("     - Discord: https://discord.gg/zama");
    console.log("     - Telegram: https://t.me/zama_fhe");
    console.log("");
    console.log("  2. Use V1 for now:");
    console.log("     echo \"VITE_USE_V2=false\" > privyrep-frontend/.env");

  } else {
    console.log("Status: 🔴 OFFLINE");
    console.log("Confidence: HIGH");
    console.log("");
    console.log("❌ Recommendation: Use V1 for demo");
    console.log("");
    console.log("Relayer appears to be offline or unavailable.");
    console.log("");
    console.log("Actions:");
    console.log("  1. Use V1 for your demo:");
    console.log("     echo \"VITE_USE_V2=false\" > privyrep-frontend/.env");
    console.log("");
    console.log("  2. Start oracleService.js:");
    console.log("     npx hardhat run scripts/oracleService.js --network sepolia");
    console.log("");
    console.log("  3. Monitor Zama announcements for Relayer recovery");
  }

  console.log("\n" + "=".repeat(70));
  console.log("💡 TIP: Run this script before your demo to check status");
  console.log("Command: npx hardhat run scripts/checkRelayerStatus.js --network sepolia");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
