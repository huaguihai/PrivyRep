/**
 * Monitor Oracle Callback for VerificationServiceV2
 *
 * This script monitors a verification task and checks if the Oracle callback was executed.
 *
 * Usage:
 *   node scripts/monitorCallback.js <taskId>
 *
 * Example:
 *   node scripts/monitorCallback.js 1
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    console.error("❌ Error: Please provide a taskId as an argument");
    console.log("\nUsage: node scripts/monitorCallback.js <taskId>");
    console.log("Example: node scripts/monitorCallback.js 1");
    process.exit(1);
  }

  console.log("\n🔍 Oracle Callback Monitor");
  console.log("═══════════════════════════════════════════════════════\n");

  // Load latest V2 deployment
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith("sepolia-v2-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("❌ No V2 deployment found in deployments/ directory");
    process.exit(1);
  }

  const deploymentFile = path.join(deploymentsDir, files[0]);
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const verificationServiceAddress = deployment.contracts.VerificationServiceV2;

  console.log(`📝 Deployment: ${files[0]}`);
  console.log(`📍 Contract: ${verificationServiceAddress}`);
  console.log(`🎯 Task ID: ${taskId}\n`);

  // Get contract instance
  const VerificationServiceV2 = await hre.ethers.getContractFactory("VerificationServiceV2");
  const verificationService = VerificationServiceV2.attach(verificationServiceAddress);

  // Monitor task status
  console.log("⏳ Monitoring task status...\n");

  let attempts = 0;
  const maxAttempts = 60; // Monitor for up to 5 minutes (5s intervals)
  const interval = 5000; // 5 seconds

  while (attempts < maxAttempts) {
    try {
      // Get task details
      const task = await verificationService.getVerificationTask(taskId);
      const callbackCalled = await verificationService.isCallbackCalled(taskId);

      console.log(`\n[${new Date().toISOString()}] Attempt ${attempts + 1}/${maxAttempts}`);
      console.log("─────────────────────────────────────────────────────");
      console.log(`👤 User: ${task.user}`);
      console.log(`✅ Completed: ${task.completed}`);
      console.log(`🎯 Passed: ${task.passed}`);
      console.log(`📞 Callback Called: ${callbackCalled}`);
      console.log(`🔑 Decryption Request ID: ${task.decryptionRequestId.toString()}`);
      console.log(`📅 Created At: ${new Date(Number(task.createdAt) * 1000).toISOString()}`);

      // Check if callback was executed
      if (callbackCalled && task.completed) {
        console.log("\n✅ SUCCESS: Oracle callback executed!");
        console.log("─────────────────────────────────────────────────────");
        console.log(`🎉 Verification ${task.passed ? "PASSED" : "FAILED"}`);

        if (task.passed) {
          console.log("\n💰 Reputation should have been awarded to user");
          console.log(`   Check ReputationScore.getScore(${task.user})`);
        }

        console.log("\n🔗 View on Sepolia Etherscan:");
        console.log(`   https://sepolia.etherscan.io/address/${verificationServiceAddress}`);

        process.exit(0);
      }

      // Check if callback was called but task not completed (error case)
      if (callbackCalled && !task.completed) {
        console.log("\n⚠️  WARNING: Callback called but task not completed");
        console.log("   This might indicate an issue with the callback logic");
        process.exit(1);
      }

      // Task completed without callback (manual completion or error)
      if (task.completed && !callbackCalled) {
        console.log("\n⚠️  WARNING: Task completed without callback");
        console.log("   This might indicate Oracle service issues");
        process.exit(1);
      }

      // Still waiting
      console.log("\n⏳ Waiting for Oracle callback...");

    } catch (error) {
      console.error(`\n❌ Error querying task: ${error.message}`);
      if (error.message.includes("invalid task")) {
        console.error("   Task ID might not exist. Please check the task ID.");
        process.exit(1);
      }
    }

    attempts++;

    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  console.log("\n⏱️  TIMEOUT: Oracle callback not received after 5 minutes");
  console.log("─────────────────────────────────────────────────────");
  console.log("\n🔍 Possible reasons:");
  console.log("   1. Oracle service delay (can take several minutes on testnet)");
  console.log("   2. Insufficient gas for callback transaction");
  console.log("   3. Oracle service configuration issues");
  console.log("   4. Network congestion on Sepolia");
  console.log("\n💡 What to do:");
  console.log("   1. Wait longer and run this script again");
  console.log("   2. Check Sepolia Etherscan for callback transaction");
  console.log("   3. Verify Oracle service is running properly");
  console.log(`\n🔗 Monitor contract on Etherscan:`);
  console.log(`   https://sepolia.etherscan.io/address/${verificationServiceAddress}`);

  process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
