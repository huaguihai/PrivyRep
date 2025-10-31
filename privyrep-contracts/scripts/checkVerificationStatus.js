const hre = require("hardhat");

async function main() {
  // V1 合约地址
  const VERIFICATION_SERVICE_ADDRESS = "0xe43D69d358a79E92c9dE402303aE957102090a75";
  const REPUTATION_SCORE_ADDRESS = "0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7";

  // 获取当前账户
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;

  console.log("\n=== Checking Verification Status ===");
  console.log("User Address:", userAddress);
  console.log("\n--- V1 VerificationService ---");
  console.log("Contract:", VERIFICATION_SERVICE_ADDRESS);

  // 获取 VerificationService 合约
  const VerificationService = await hre.ethers.getContractAt(
    "VerificationService",
    VERIFICATION_SERVICE_ADDRESS
  );

  try {
    // 1. 检查用户的待处理任务数量
    const taskCount = await VerificationService.getUserTaskCount(userAddress);
    console.log("\n📋 Pending Task Count:", taskCount.toString());

    // 2. 检查用户完成的验证次数
    const verificationCount = await VerificationService.getUserVerificationCount(userAddress);
    console.log("✅ Completed Verification Count:", verificationCount.toString());

    // 3. 如果有待处理任务，显示任务详情
    if (taskCount > 0) {
      console.log("\n⏳ Pending Tasks:");
      for (let i = 1; i <= taskCount; i++) {
        try {
          // 注意：V1 的 taskId 从 1 开始
          const task = await VerificationService.userTasks(userAddress, i);
          console.log(`\nTask #${i}:`);
          console.log("  - Task ID:", task.taskId ? task.taskId.toString() : "N/A");
          console.log("  - Is Completed:", task.isCompleted);
          console.log("  - Passed:", task.passed);
          console.log("  - Timestamp:", new Date(Number(task.timestamp) * 1000).toLocaleString());
        } catch (err) {
          console.log(`  Task #${i} - Error reading:`, err.message);
        }
      }
    }

    // 4. 检查声誉分数
    const ReputationScore = await hre.ethers.getContractAt(
      "ReputationScore",
      REPUTATION_SCORE_ADDRESS
    );
    const score = await ReputationScore.getScore(userAddress);
    console.log("\n🏆 Reputation Score:", score.toString());

    // 5. 尝试读取最近的事件
    console.log("\n📡 Checking recent VerificationRequested events...");
    const filter = VerificationService.filters.VerificationRequested(userAddress);
    const events = await VerificationService.queryFilter(filter, -1000); // 最近1000个区块
    console.log("Found", events.length, "verification request(s)");

    if (events.length > 0) {
      events.forEach((event, index) => {
        console.log(`\nRequest #${index + 1}:`);
        console.log("  Block:", event.blockNumber);
        console.log("  Transaction:", event.transactionHash);
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
