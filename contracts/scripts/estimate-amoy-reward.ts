
import { network } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

async function main() {
  const { ethers } = await network.connect();
  const [wallet] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD"
  );

  const certificateRegistry = await ethers.getContractAt(
    "CertificateHashRegistry",
    "0x5435526FE054c58D7C70c4764ae28eCCA74AD57B"
  );

  const demoCertificate = "SkillChain demo certificate - test only";
  const certificateHash = keccak256(toUtf8Bytes(demoCertificate));

  console.log("Wallet:", wallet.address);
  console.log("Demo certificate hash:", certificateHash);

  const alreadyRegistered =
    await certificateRegistry.verifyCertificate(certificateHash);

  console.log("Hash already registered:", alreadyRegistered);

  if (alreadyRegistered) {
    console.log("This demo hash is already registered.");
    return;
  }

  const gasUnits =
    await certificateRegistry.registerCertificate.estimateGas(
      certificateHash,
      "SkillChain Demo Issuer"
    );

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;

  if (gasPrice === null) {
    throw new Error("Could not determine current gas price.");
  }

  console.log("Registration gas units:", gasUnits.toString());
  console.log(
    "Estimated registration cost:",
    ethers.formatEther(gasUnits * gasPrice),
    "POL"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

