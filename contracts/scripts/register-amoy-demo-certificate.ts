import { network } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

async function main() {
  const { ethers } = await network.connect();
  const [wallet] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "CertificateHashRegistry",
    "0x5435526FE054c58D7C70c4764ae28eCCA74AD57B"
  );

  const demoCertificate = "SkillChain demo certificate - test only";
  const certificateHash = keccak256(toUtf8Bytes(demoCertificate));
  const issuer = "SkillChain Demo Issuer";

  console.log("Wallet:", wallet.address);
  console.log("Certificate hash:", certificateHash);

  const alreadyRegistered =
    await registry.verifyCertificate(certificateHash);

  if (alreadyRegistered) {
    console.log("Certificate is already registered. No transaction sent.");
    return;
  }

  const tx = await registry.registerCertificate(certificateHash, issuer);

  console.log("Transaction submitted:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Registration transaction failed.");
  }

  console.log("Registration successful!");
  console.log("Transaction hash:", receipt.hash);
  console.log("Issuer:", issuer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
