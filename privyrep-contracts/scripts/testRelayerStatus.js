const hre = require("hardhat");

/**
 * 测试 Zama Relayer 是否正常工作
 * 通过检查 Gateway 合约是否可访问来判断
 */
async function main() {
  console.log("\n=== Testing Zama Relayer Status ===\n");

  try {
    // Zama Gateway 地址（Sepolia）- 使用 getAddress 确保 checksum 正确
    const GATEWAY_ADDRESS = hre.ethers.getAddress("0x33347831500F1e73f102414fAf8a9F3F63cCE4c5");

    console.log("1️⃣ Checking Gateway contract...");
    console.log("   Gateway Address:", GATEWAY_ADDRESS);

    // 尝试获取 Gateway 合约的代码
    const code = await hre.ethers.provider.getCode(GATEWAY_ADDRESS);

    if (code === "0x") {
      console.log("   ❌ Gateway contract not found at this address");
      console.log("   🔴 Relayer likely not available");
      return false;
    }

    console.log("   ✅ Gateway contract exists");
    console.log("   Code length:", code.length, "bytes");

    // 检查网络连接
    console.log("\n2️⃣ Checking network connectivity...");
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("   ✅ Connected to Sepolia");
    console.log("   Current block:", blockNumber);

    // 尝试调用 Gateway（如果有 ABI）
    console.log("\n3️⃣ Checking Gateway accessibility...");

    // 简单的测试：尝试估算 gas
    try {
      const gasPrice = await hre.ethers.provider.getFeeData();
      console.log("   ✅ Network is responsive");
      console.log("   Gas price:", hre.ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    } catch (error) {
      console.log("   ⚠️  Network issue:", error.message);
    }

    // 检查是否有最近的交易到 Gateway
    console.log("\n4️⃣ Checking recent Gateway activity...");
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const fromBlock = currentBlock - 1000; // 最近 1000 个区块

    try {
      const filter = {
        address: GATEWAY_ADDRESS,
        fromBlock: fromBlock,
        toBlock: currentBlock
      };

      const logs = await hre.ethers.provider.getLogs(filter);

      if (logs.length > 0) {
        console.log(`   ✅ Found ${logs.length} Gateway events in last 1000 blocks`);
        console.log("   🟢 Gateway appears to be active!");

        // 显示最近的一个事件
        const latestLog = logs[logs.length - 1];
        const block = await hre.ethers.provider.getBlock(latestLog.blockNumber);
        const timeAgo = Math.floor((Date.now() / 1000) - Number(block.timestamp));
        console.log(`   Latest activity: ${timeAgo} seconds ago (block ${latestLog.blockNumber})`);
      } else {
        console.log("   ⚠️  No recent Gateway events found");
        console.log("   🟡 Gateway might be idle or not fully operational");
      }
    } catch (error) {
      console.log("   ⚠️  Could not fetch Gateway events:", error.message);
    }

    // 总结
    console.log("\n" + "=".repeat(50));
    console.log("📊 Summary:");
    console.log("=".repeat(50));
    console.log("Gateway Contract: ✅ Deployed");
    console.log("Network: ✅ Connected");

    if (logs && logs.length > 0) {
      console.log("Recent Activity: ✅ Active");
      console.log("\n🎉 Zama Relayer appears to be OPERATIONAL!");
      console.log("✅ You can proceed with V2 deployment");
    } else {
      console.log("Recent Activity: ⚠️  No recent events");
      console.log("\n⚠️  Relayer status uncertain");
      console.log("Recommendation: Check Zama Discord/Telegram for updates");
    }

  } catch (error) {
    console.error("\n❌ Error testing Relayer:", error.message);
    console.log("\n🔴 Could not verify Relayer status");
    console.log("Recommendation: Wait for official Zama announcement");
    return false;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
