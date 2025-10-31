const hre = require("hardhat");

async function main() {
  // V1 合约地址
  const VERIFICATION_SERVICE_ADDRESS = "0xe43D69d358a79E92c9dE402303aE957102090a75";

  // 获取当前账户
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;

  console.log("\n=== Checking User Verification Events ===");
  console.log("User Address:", userAddress);
  console.log("Contract Address:", VERIFICATION_SERVICE_ADDRESS);

  // 获取 VerificationService 合约
  const VerificationService = await hre.ethers.getContractAt(
    "VerificationService",
    VERIFICATION_SERVICE_ADDRESS
  );

  try {
    // 获取当前区块号
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    console.log("\nCurrent Block:", currentBlock);

    // 查询最近 10000 个区块的事件（大约 1.5 天）
    const fromBlock = currentBlock - 10000 > 0 ? currentBlock - 10000 : 0;
    console.log("Searching from block:", fromBlock, "to", currentBlock);

    // 1. 查询 VerificationRequested 事件
    console.log("\n📡 Checking VerificationRequested events...");
    const requestedFilter = VerificationService.filters.VerificationRequested(null, userAddress);
    const requestedEvents = await VerificationService.queryFilter(requestedFilter, fromBlock, currentBlock);

    console.log(`Found ${requestedEvents.length} VerificationRequested event(s)`);

    if (requestedEvents.length > 0) {
      requestedEvents.forEach((event, index) => {
        console.log(`\n--- Request #${index + 1} ---`);
        console.log("  Block Number:", event.blockNumber);
        console.log("  Transaction Hash:", event.transactionHash);
        console.log("  Task ID:", event.args.taskId.toString());
        console.log("  User:", event.args.user);
      });
    }

    // 2. 查询 VerificationCompleted 事件
    console.log("\n📡 Checking VerificationCompleted events...");
    const completedFilter = VerificationService.filters.VerificationCompleted(null, userAddress);
    const completedEvents = await VerificationService.queryFilter(completedFilter, fromBlock, currentBlock);

    console.log(`Found ${completedEvents.length} VerificationCompleted event(s)`);

    if (completedEvents.length > 0) {
      completedEvents.forEach((event, index) => {
        console.log(`\n--- Completed #${index + 1} ---`);
        console.log("  Block Number:", event.blockNumber);
        console.log("  Transaction Hash:", event.transactionHash);
        console.log("  Task ID:", event.args.taskId.toString());
        console.log("  User:", event.args.user);
        console.log("  Passed:", event.args.passed);
      });
    }

    // 3. 如果没有事件，查询所有用户的事件（看看合约是否有任何活动）
    if (requestedEvents.length === 0) {
      console.log("\n⚠️  No events found for your address. Checking all events...");
      const allRequestedFilter = VerificationService.filters.VerificationRequested();
      const allRequestedEvents = await VerificationService.queryFilter(allRequestedFilter, fromBlock, currentBlock);
      console.log(`Total VerificationRequested events in range: ${allRequestedEvents.length}`);

      if (allRequestedEvents.length > 0) {
        console.log("\nSample events from other users:");
        allRequestedEvents.slice(0, 3).forEach((event, index) => {
          console.log(`\n  Event #${index + 1}:`);
          console.log("    Task ID:", event.args.taskId.toString());
          console.log("    User:", event.args.user);
          console.log("    Block:", event.blockNumber);
        });
      }
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.error) {
      console.error("Details:", error.error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
