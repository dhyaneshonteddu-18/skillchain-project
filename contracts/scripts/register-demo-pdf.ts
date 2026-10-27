import { network } from "hardhat";
import { keccak256 } from "ethers";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

async function main() {
  const { ethers } = await network.connect();
  const [wallet] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "CertificateHashRegistry",
    "0x5435526FE054c58D7C70c4764ae28eCCA74AD57B"
  );

  const filePath = join(
    homedir(),
    "Desktop",
    "SkillChain-Demo-Certificate.pdf"
  );

  const fileBytes = readFileSync(filePath);
  const certificateHash = keccak256(fileBytes);
  const issuer = "SkillChain Demo Issuer";

  console.log("Wallet:", wallet.address);
  console.log("File:", filePath);
  console.log("Certificate hash:", certificateHash);

  const alreadyRegistered =
    await registry.verifyCertificate(certificateHash);

  if (alreadyRegistered) {
    console.log("This PDF is already registered. No transaction sent.");
    return;
  }

  const tx = await registry.registerCertificate(
    certificateHash,
    issuer
  );

  console.log("Transaction submitted:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Registration transaction failed.");
  }

  console.log("PDF registration successful!");
  console.log("Transaction:", receipt.hash);
  console.log("Issuer:", issuer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
