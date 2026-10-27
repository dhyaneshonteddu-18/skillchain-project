import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SkillChainModule", (m) => {
  const admin = m.getAccount(0);
  const skillCoin = m.contract("SkillCoin", [admin]);
  const skillBadge = m.contract("SkillBadge", [admin]);
  const certificateRegistry = m.contract("CertificateHashRegistry", [admin]);
  const registry = m.contract("AchievementRegistry", [admin, skillCoin, skillBadge, certificateRegistry]);
  const bounty = m.contract("SkillBounty", [admin, skillCoin, skillBadge]);
  m.call(skillCoin, "addVerifier", [registry], { id: "registryVerifierCoin" });
  m.call(skillBadge, "addVerifier", [registry], { id: "registryVerifierBadge" });
  return { skillCoin, skillBadge, certificateRegistry, registry, bounty };
});
