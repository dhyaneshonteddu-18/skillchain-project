import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.connect();

describe("SkillBounty", function () {
  async function fixture() {
    const [admin, creator, student, stranger] = await ethers.getSigners();
    const coin = await (await ethers.getContractFactory("SkillCoin")).deploy(admin.address);
    const badge = await (await ethers.getContractFactory("SkillBadge")).deploy(admin.address);
    const bounty = await (await ethers.getContractFactory("SkillBounty")).deploy(admin.address, await coin.getAddress(), await badge.getAddress());
    await coin.addVerifier(admin.address);
    await coin.mint(creator.address, ethers.parseUnits("100", 18));
    await badge.mintBadge(student.address, "AWS_CERT", "ipfs://aws-proof");
    return { admin, creator, student, stranger, coin, badge, bounty };
  }
  it("escrows SKC and pays an eligible student after approval", async function () {
    const { creator, student, coin, bounty } = await fixture();
    const reward = ethers.parseUnits("25", 18);
    await coin.connect(creator).approve(await bounty.getAddress(), reward);
    await bounty.connect(creator).createBounty("Solidity voting", "Build and test a voting contract", "AWS_CERT", reward);
    expect(await coin.balanceOf(await bounty.getAddress())).to.equal(reward);
    await bounty.connect(student).submitWork(0, "ipfs://submission");
    await bounty.connect(creator).approveSubmission(0, student.address);
    expect(await coin.balanceOf(student.address)).to.equal(reward);
    expect((await bounty.bounties(0)).status).to.equal(1n);
  });
  it("rejects a student without the required badge", async function () {
    const { creator, stranger, coin, bounty } = await fixture();
    const reward = ethers.parseUnits("10", 18);
    await coin.connect(creator).approve(await bounty.getAddress(), reward);
    await bounty.connect(creator).createBounty("AWS task", "Task details", "AWS_CERT", reward);
    await expect(bounty.connect(stranger).submitWork(0, "ipfs://submission")).to.be.revert(ethers);
  });
  it("refunds a bounty only when no active submissions remain", async function () {
    const { creator, coin, bounty } = await fixture();
    const reward = ethers.parseUnits("10", 18);
    await coin.connect(creator).approve(await bounty.getAddress(), reward);
    await bounty.connect(creator).createBounty("Unused task", "Task details", "AWS_CERT", reward);
    await bounty.connect(creator).cancelBounty(0);
    expect(await coin.balanceOf(creator.address)).to.equal(ethers.parseUnits("100", 18));
  });
});
