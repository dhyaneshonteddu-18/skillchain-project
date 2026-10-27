import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("AchievementRegistry", function () {
  async function deployFixture() {
    const [admin, student,other] = await ethers.getSigners();
    const coin = await (await ethers.getContractFactory("SkillCoin")).deploy(admin.address);
    const badge = await (await ethers.getContractFactory("SkillBadge")).deploy(admin.address);
    const certs = await (await ethers.getContractFactory("CertificateHashRegistry")).deploy(admin.address);
    const registry = await (await ethers.getContractFactory("AchievementRegistry")).deploy(admin.address, await coin.getAddress(), await badge.getAddress(), await certs.getAddress());
    await coin.addVerifier(await registry.getAddress());
    await badge.addVerifier(await registry.getAddress());
    return { admin, student, other, coin, badge, certs, registry };
  }

  it("mints the correct whole-token reward and a badge atomically", async function () {
    const { student, coin, badge, registry } = await deployFixture();
    await registry.approveAchievement(student.address, "AWS_CERT", "ipfs://proofhash");
    expect(await coin.balanceOf(student.address)).to.equal(ethers.parseUnits("150", 18));
    expect(await badge.ownerOf(0)).to.equal(student.address);
    expect(await badge.achievementType(0)).to.equal("AWS_CERT");
    expect(await badge.hasAchievementType(student.address, "AWS_CERT")).to.equal(true);
    await expect(registry.approveAchievement(student.address, "AWS_CERT", "ipfs://proofhash")).to.be.revert(ethers);
  });

  it("requires a registered issuer-checked hash for hash-based approval", async function () {
    const { admin, student, coin, registry, certs } = await deployFixture();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("sample certificate bytes"));
    await expect(registry.approveAchievementWithHash(student.address, "AWS_CERT", "ipfs://proof", hash)).to.be.revert(ethers);
    await certs.registerCertificate(hash, "Demo Issuer (checked by admin)");
    await registry.approveAchievementWithHash(student.address, "AWS_CERT", "ipfs://proof", hash);
    expect(await coin.balanceOf(student.address)).to.equal(ethers.parseUnits("150", 18));
  });
});
