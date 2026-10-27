import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SkillBadge", function () {
  it("should mint a badge and block transfers", async function () {
    const [admin, student, other] = await ethers.getSigners();

    const SkillBadge = await ethers.getContractFactory("SkillBadge");
    const skillBadge = await SkillBadge.deploy(admin.address);
    await skillBadge.waitForDeployment();

    // Admin (verifier) mints a badge to student
    const tx = await skillBadge
      .connect(admin)
      .mintBadge(student.address, "AWS_CERT", "ipfs://fakehash123");
    await tx.wait();

    expect(await skillBadge.ownerOf(0)).to.equal(student.address);
    expect(await skillBadge.achievementType(0)).to.equal("AWS_CERT");

    // Student tries to transfer badge to someone else — should fail
    await expect(
      skillBadge
        .connect(student)
        .transferFrom(student.address, other.address, 0)
    ).to.be.revert(ethers);
  });
});
