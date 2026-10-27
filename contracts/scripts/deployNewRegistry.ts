import { getNamedAccounts, deployments, ethers } from 'hardhat';

async function main() {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  
  console.log("Deploying new AchievementRegistry with updated code...");
  console.log("Deployer:", deployer);
}

main().catch(console.error);
