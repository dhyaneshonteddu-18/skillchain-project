import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("SkillCoin", function () {
  it("should mint tokens only via verifier role", async function () {
    const [admin, student, outsider] = await ethers.getSigners();

    const SkillCoin = await ethers.getContractFactory("SkillCoin");
    const skillCoin = await SkillCoin.deploy(admin.address);
    await skillCoin.waitForDeployment();

    // Admin (verifier) mints 100 SkillCoins to student
    await skillCoin.connect(admin).mint(student.address, 100);
    expect(await skillCoin.balanceOf(student.address)).to.equal(100);

    // Outsider (no verifier role) tries to mint — should fail
    await expect(
      skillCoin.connect(outsider).mint(student.address, 50)
    ).to.be.revert(ethers);
  });
});
