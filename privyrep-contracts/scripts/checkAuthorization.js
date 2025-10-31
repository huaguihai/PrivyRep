const hre = require("hardhat");

async function main() {
  const REPUTATION_SCORE_ADDRESS = "0x21b37E6Fa00C91E5cB04b18cA9544bEDaC234aC7";
  const VERIFICATION_SERVICE_ADDRESS = "0xe43D69d358a79E92c9dE402303aE957102090a75";

  console.log("\n=== Checking Authorization Status ===\n");

  const reputationScore = await hre.ethers.getContractAt(
    "ReputationScore",
    REPUTATION_SCORE_ADDRESS
  );

  // 检查 VerificationService 是否被授权
  const isAuthorized = await reputationScore.authorizedCallers(VERIFICATION_SERVICE_ADDRESS);

  console.log("VerificationService Address:", VERIFICATION_SERVICE_ADDRESS);
  console.log("Is Authorized:", isAuthorized);

  if (!isAuthorized) {
    console.log("\n❌ PROBLEM FOUND: VerificationService is NOT authorized!");
    console.log("\n🔧 Fixing authorization...");

    const [owner] = await hre.ethers.getSigners();
    const tx = await reputationScore.setAuthorizedCaller(VERIFICATION_SERVICE_ADDRESS, true);
    await tx.wait();

    console.log("✅ Authorization fixed!");
    console.log("TX Hash:", tx.hash);
  } else {
    console.log("\n✅ Authorization is correct");
  }

  // 检查用户分数
  const userAddress = "0x189455724a69815d75c5A972b0C31F48D0d84fcE";
  const score = await reputationScore.getScore(userAddress);
  const verificationCount = await reputationScore.getUserVerificationCount(userAddress);

  console.log("\n📊 User Stats:");
  console.log("  Address:", userAddress);
  console.log("  Score:", score.toString());
  console.log("  Verification Count:", verificationCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
