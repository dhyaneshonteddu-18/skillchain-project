import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [admin] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  );

  const verifierRole = await registry.VERIFIER_ROLE();

  console.log("Admin account:", admin.address);
  console.log(
    "Has verifier role:",
    await registry.hasRole(verifierRole, admin.address)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
