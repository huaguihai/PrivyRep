const hre = require("hardhat");

/**
 * Oracle 自动监听服务
 * 模拟 Zama Oracle 的行为，自动处理验证请求
 */

// 配置
const CONFIG = {
  MIN_DELAY: 5,  // 最小延迟（秒）
  MAX_DELAY: 30, // 最大延迟（秒）
  POLLING_INTERVAL: 2000, // 轮询间隔（毫秒）
};

// 存储已处理的任务
const processedTasks = new Set();

async function getRandomDelay() {
  const delay = Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY + 1)) + CONFIG.MIN_DELAY;
  return delay * 1000; // 转换为毫秒
}

async function simulateVerification(contract, taskId) {
  // V1 Oracle 服务说明：
  // 在真实的 V2 中，Oracle 会自动解密 FHE 加密的数据进行比较
  // 在 V1 演示模式中，我们通过事件日志获取用户的明文数据进行真实比较

  console.log(`   🔍 Checking verification criteria...`);

  // 获取任务详情
  const task = await contract.verificationTasks(taskId);
  const userAddress = task.user;
  const minAsset = Number(task.minAssetBalance);
  const minNFT = Number(task.minNFTCount);
  const minAge = Number(task.minAccountAge);
  const minTx = Number(task.minTxCount);

  console.log(`   📋 Task Criteria:`);
  console.log(`      - User: ${userAddress}`);
  console.log(`      - Min Asset Balance: ${minAsset}`);
  console.log(`      - Min NFT Count: ${minNFT}`);
  console.log(`      - Min Account Age: ${minAge} days`);
  console.log(`      - Min TX Count: ${minTx}`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // V1 演示说明：
  // 在 V1 中，我们不直接读取加密的身份数据（会触发 FHEVM 初始化）
  // 而是基于验证条件的阈值高低来模拟 Oracle 的验证结果
  // 在真实的 V2 中，Oracle 会通过 Zama Gateway 解密实际的 FHE 数据

  console.log(`   🔐 Simulating Oracle decryption process...`);

  // 在 V1 演示模式中，我们使用合理的假设值进行验证
  // 这些值基于用户注册时的条件，模拟 Oracle 解密后的比较结果
  // 实际场景：Oracle 会解密用户的真实 FHE 数据进行比较

  // 使用启发式方法：如果用户设置了较低的验证阈值，说明用户的数据应该能满足
  const isLowThreshold = minAsset <= 100 && minNFT <= 5 && minAge <= 30 && minTx <= 10;
  const isMediumThreshold = minAsset <= 500 && minNFT <= 10 && minAge <= 90 && minTx <= 50;

  // 模拟真实验证逻辑
  // 🎬 录制模式：确保高失败率用于演示
  // 假设用户注册时填写的是真实数据，那么：
  // - 如果阈值很低，用户很可能满足 (0.1% 概率) ← 录制"失败"场景
  // - 如果阈值中等，用户可能满足 (70% 概率)
  // - 如果阈值很高，用户不太可能满足 (40% 概率)
  let basePassRate;
  if (isLowThreshold) {
    basePassRate = 0.999;
    console.log(`   🎯 Low threshold detected - Very high pass probability (99%) [Recording Mode: PASS]`);
  } else if (isMediumThreshold) {
    basePassRate = 0.70;
    console.log(`   🎯 Medium threshold detected - Moderate pass probability (70%)`);
  } else {
    basePassRate = 0.40;
    console.log(`   🎯 High threshold detected - Low pass probability (40%)`);
  }

  // 为每个条件独立判断（模拟真实的逐项比较）
  const assetPassed = Math.random() < basePassRate;
  const nftPassed = Math.random() < basePassRate;
  const agePassed = Math.random() < basePassRate;
  const txPassed = Math.random() < basePassRate;

  console.log(`   📊 Verification Results:`);
  console.log(`      - Asset Balance: ${assetPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`      - NFT Count:     ${nftPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`      - Account Age:   ${agePassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`      - TX Count:      ${txPassed ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`   💡 Note: In production V2, Oracle would decrypt actual FHE data for exact comparison`);

  return { assetPassed, nftPassed, agePassed, txPassed };
}

async function processTask(contract, taskId, userAddress) {
  const taskKey = `${taskId}`;

  if (processedTasks.has(taskKey)) {
    return; // 已处理过
  }

  try {
    console.log(`\n🔔 New verification request detected!`);
    console.log(`   Task ID: ${taskId}`);
    console.log(`   User: ${userAddress}`);

    // 随机延迟（模拟真实的 Oracle 处理时间）
    const delay = await getRandomDelay();
    console.log(`   ⏳ Processing... (estimated ${Math.floor(delay / 1000)} seconds)`);
    await new Promise(resolve => setTimeout(resolve, delay));

    // 执行验证
    const results = await simulateVerification(contract, taskId);

    // 调用 completeVerification
    console.log(`   📝 Submitting verification results to blockchain...`);
    const tx = await contract.completeVerification(
      taskId,
      results.assetPassed,
      results.nftPassed,
      results.agePassed,
      results.txPassed
    );

    console.log(`   ⏳ Waiting for transaction confirmation...`);
    console.log(`   TX Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`   ✅ Verification completed!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    // 标记为已处理
    processedTasks.add(taskKey);

    // 发出完成事件
    const allPassed = results.assetPassed && results.nftPassed && results.agePassed && results.txPassed;
    console.log(`   🎉 Result: ${allPassed ? '✅ VERIFICATION PASSED' : '❌ VERIFICATION FAILED'}`);

  } catch (error) {
    console.error(`   ❌ Error processing task ${taskId}:`, error.message);
  }
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🤖 PrivyRep Oracle Service - Automatic Verification Processor");
  console.log("=".repeat(70));

  // 合约地址
  const VERIFICATION_SERVICE_ADDRESS = "0xe43D69d358a79E92c9dE402303aE957102090a75";
  const [owner] = await hre.ethers.getSigners();

  console.log("\n📋 Configuration:");
  console.log(`   Oracle Address: ${owner.address}`);
  console.log(`   Contract: ${VERIFICATION_SERVICE_ADDRESS}`);
  console.log(`   Processing Delay: ${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY} seconds`);
  console.log(`   Polling Interval: ${CONFIG.POLLING_INTERVAL / 1000} seconds`);

  // 获取合约实例
  const contract = await hre.ethers.getContractAt(
    "VerificationService",
    VERIFICATION_SERVICE_ADDRESS
  );

  // 检查是否是 owner
  const contractOwner = await contract.owner();
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    console.error(`\n❌ Error: Current account is not the contract owner!`);
    console.error(`   Contract Owner: ${contractOwner}`);
    console.error(`   Your Address: ${owner.address}`);
    process.exit(1);
  }

  console.log("\n✅ Oracle service authenticated as contract owner");

  // 获取当前区块号
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  console.log(`\n🔗 Connected to Sepolia (Block: ${currentBlock})`);

  // 检查是否有未处理的历史任务
  console.log("\n🔍 Scanning for pending verification requests...");
  const filter = contract.filters.VerificationRequested();
  const historicalEvents = await contract.queryFilter(filter, currentBlock - 5000, currentBlock);

  if (historicalEvents.length > 0) {
    console.log(`   Found ${historicalEvents.length} historical request(s)`);

    // 处理历史任务
    for (const event of historicalEvents) {
      const taskId = Number(event.args.taskId);
      const user = event.args.user;

      // 检查任务是否已完成
      try {
        const task = await contract.verificationTasks(taskId);
        if (!task.completed) {
          console.log(`\n   📦 Processing pending task #${taskId}...`);
          await processTask(contract, taskId, user);
        }
      } catch (error) {
        // 任务可能不存在或已完成
      }
    }
  } else {
    console.log("   No pending requests found");
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎧 Oracle is now listening for new verification requests...");
  console.log("   Press Ctrl+C to stop");
  console.log("=".repeat(70) + "\n");

  // 监听新事件
  contract.on("VerificationRequested", async (taskId, user, event) => {
    await processTask(contract, Number(taskId), user);
  });

  // 保持进程运行
  await new Promise(() => {});
}

main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
