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

  const skillCoin = await ethers.getContractAt(
    "SkillCoin",
    "0x98c519d5e93F01E8cd7d58adbf0403bc6dCd686A"
  );

  const skillBadge = await ethers.getContractAt(
    "SkillBadge",
    "0x75ADc70529De813EE6760A4002aC44FC63b772Cd"
  );

  console.log("Network chain ID:", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("Wallet/student:", student);

  console.log(
    "DEMO reward:",
    ethers.formatUnits(await registry["rewardAmount"]("DEMO"), 18),
    "SKC"
  );

  console.log(
    "DEMO already claimed:",
    await registry["claimed"](student, "DEMO")
  );

  console.log(
    "Student SKC balance:",
    ethers.formatUnits(await skillCoin["balanceOf"](student), 18)
  );

  const verifierRole = await registry["VERIFIER_ROLE"]();
  const adminRole = await registry["DEFAULT_ADMIN_ROLE"]();

  console.log(
    "Wallet has verifier role:",
    await registry["hasRole"](verifierRole, wallet.address)
  );

  console.log(
    "Wallet has registry admin role:",
    await registry["hasRole"](adminRole, wallet.address)
  );

  console.log(
    "Demo PDF hash registered:",
    await certificateRegistry["verifyCertificate"](
      "0x8be0c3bed496ec5a03bfa659828d46d673d049256b5d69c90a22e498533c054e"
    )
  );

  console.log("Diagnostic complete. No transaction sent.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
