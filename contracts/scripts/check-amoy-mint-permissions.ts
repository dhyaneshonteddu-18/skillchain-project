
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const achievementAddress =
    "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD";

  const coinAddress =
    "0x98c519d5e93F01E8cd7d58adbf0403bc6dCd686A";

  const badgeAddress =
    "0x75ADc70529De813EE6760A4002aC44FC63b772Cd";

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    achievementAddress
  );

  const coin = await ethers.getContractAt(
    "SkillCoin",
    coinAddress
  );

  const badge = await ethers.getContractAt(
    "SkillBadge",
    badgeAddress
  );

  const registryVerifierRole =
    await registry["VERIFIER_ROLE"]();

  const coinVerifierRole =
    await coin["VERIFIER_ROLE"]();

  const badgeVerifierRole =
    await badge["VERIFIER_ROLE"]();

  console.log(
    "AchievementRegistry has SkillCoin mint permission:",
    await coin["hasRole"](coinVerifierRole, achievementAddress)
  );

  console.log(
    "AchievementRegistry has SkillBadge mint permission:",
    await badge["hasRole"](badgeVerifierRole, achievementAddress)
  );

  console.log(
    "Connected wallet has AchievementRegistry verifier permission:",
    await registry["hasRole"](
      registryVerifierRole,
      (await ethers.getSigners())[0].address
    )
  );

  console.log(
    "AchievementRegistry DEMO reward:",
    ethers.formatUnits(
      await registry["rewardAmount"]("DEMO"),
      18
    ),
    "SKC"
  );

  console.log("Read-only permission check complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

