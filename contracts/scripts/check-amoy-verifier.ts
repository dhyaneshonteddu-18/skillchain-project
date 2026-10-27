
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD"
  );

  const networkInfo = await ethers.provider.getNetwork();
  const verifierRole = await registry.VERIFIER_ROLE();
  const hasVerifierRole = await registry.hasRole(
    verifierRole,
    deployer.address
  );

  console.log("Network chain ID:", networkInfo.chainId.toString());
  console.log("Deployment wallet:", deployer.address);
  console.log("Verifier permission:", hasVerifierRole);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

