import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [wallet] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD"
  );

  const adminRole = await registry["DEFAULT_ADMIN_ROLE"]();
  const isAdmin = await registry["hasRole"](adminRole, wallet.address);

  console.log("Wallet:", wallet.address);
  console.log("Is registry admin:", isAdmin);

  if (!isAdmin) {
    throw new Error("This wallet is not the AchievementRegistry admin.");
  }

  const currentReward = await registry["rewardAmount"]("DEMO");
  console.log(
    "Current DEMO reward:",
    ethers.formatUnits(currentReward, 18),
    "SKC"
  );

  if (currentReward === ethers.parseUnits("150", 18)) {
    console.log("DEMO reward is already 150 SKC. No transaction needed.");
    return;
  }

  const tx = await registry["setReward"]("DEMO", 150);
  console.log("Transaction submitted:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Setting the DEMO reward failed.");
  }

  console.log("DEMO reward successfully set to 150 SKC.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
