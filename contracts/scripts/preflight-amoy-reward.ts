
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [wallet] = await ethers.getSigners();

  const student = wallet.address;

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD"
  );

  const certificateRegistry = await ethers.getContractAt(
    "CertificateHashRegistry",
    "0x5435526FE054c58D7C70c4764ae28eCCA74AD57B"
  );

  const coin = await ethers.getContractAt(
    "SkillCoin",
    "0x98c519d5e93F01E8cd7d58adbf0403bc6dCd686A"
  );

  const networkInfo = await ethers.provider.getNetwork();
  const verifierRole = await registry.VERIFIER_ROLE();
  const adminRole = await certificateRegistry.DEFAULT_ADMIN_ROLE();

  console.log("Chain ID:", networkInfo.chainId.toString());
  console.log("Wallet:", wallet.address);
  console.log(
    "Achievement verifier:",
    await registry.hasRole(verifierRole, wallet.address)
  );
  console.log(
    "Certificate registry admin:",
    await certificateRegistry.hasRole(adminRole, wallet.address)
  );
  console.log(
    "AWS_CERT reward:",
    ethers.formatUnits(await registry.rewardAmount("AWS_CERT"), 18),
    "SKC"
  );
  console.log(
    "AWS_CERT already claimed:",
    await registry.claimed(student, "AWS_CERT")
  );
  console.log(
    "Current SKC balance:",
    ethers.formatUnits(await coin.balanceOf(student), 18),
    "SKC"
  );
  console.log(
    "Available POL:",
    ethers.formatEther(
      await ethers.provider.getBalance(wallet.address)
    ),
    "POL"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

