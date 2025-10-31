const hre = require("hardhat");

async function main() {
  const VERIFICATION_SERVICE_ADDRESS = "0xe43D69d358a79E92c9dE402303aE957102090a75";

  const contract = await hre.ethers.getContractAt(
    "VerificationService",
    VERIFICATION_SERVICE_ADDRESS
  );

  console.log("\n=== Task #13 Details ===\n");
  const task = await contract.verificationTasks(13);

  console.log("User:", task.user);
  console.log("Min Asset Balance:", task.minAssetBalance.toString());
  console.log("Min NFT Count:", task.minNFTCount.toString());
  console.log("Min Account Age:", task.minAccountAge.toString());
  console.log("Min TX Count:", task.minTxCount.toString());
  console.log("Completed:", task.completed);
  console.log("Passed:", task.passed);
  console.log("Created At:", new Date(Number(task.createdAt) * 1000).toISOString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
