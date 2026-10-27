import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [admin] = await ethers.getSigners();

  const studentAddress = "0x3c01D39B46058039fB3794D5CF04007a0FAf55a0";

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  );

  const coin = await ethers.getContractAt(
    "SkillCoin",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );

  console.log("Admin:", admin.address);
  console.log("Student:", studentAddress);

  const tx = await registry.approveAchievement(
    studentAddress,
    "AWS_CERT",
    "ipfs://local-test-proof"
  );

  await tx.wait();

  console.log(
    "Student SKC balance:",
    ethers.formatUnits(
      await coin.balanceOf(studentAddress),
      18
    ),
    "SKC"
  );
}

main().catch(console.error);
