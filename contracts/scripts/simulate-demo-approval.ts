
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [wallet] = await ethers.getSigners();

  const registry = await ethers.getContractAt(
    "AchievementRegistry",
    "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD"
  );

  const student = wallet.address;

  const certificateHash =
    "0x8be0c3bed496ec5a03bfa659828d46d673d049256b5d69c90a22e498533c054e";

  const proofURI = "demo://skillchain-test-only";

  console.log("Verifier:", wallet.address);
  console.log("Student:", student);
  console.log("Achievement: DEMO");
  console.log("Reward:", ethers.formatUnits(
    await registry["rewardAmount"]("DEMO"), 18
  ), "SKC");

  console.log(
    "Already claimed:",
    await registry["claimed"](student, "DEMO")
  );

  try {
    await registry["approveAchievementWithHash"].staticCall(
      student,
      "DEMO",
      proofURI,
      certificateHash
    );

    console.log(
      "SIMULATION PASSED: the contract accepts this approval."
    );
    console.log("No transaction was sent. No POL was spent.");
  } catch (error: any) {
    console.error("SIMULATION FAILED.");
    console.error(
      "Reason:",
      error?.reason ??
      error?.shortMessage ??
      error?.message ??
      error
    );

    if (error?.data) {
      console.error("Revert data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

