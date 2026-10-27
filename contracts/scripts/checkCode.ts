import { ethers } from "hardhat";

async function main() {
  const REGISTRY_ADDRESS = "0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD";
  
  const provider = ethers.provider;
  const code = await provider.getCode(REGISTRY_ADDRESS);
  
  console.log("Contract bytecode length:", code.length);
  
  // Check if "Already claimed" is in bytecode
  if (code.includes("416c726561647920636c61696d6564")) {
    console.log("⚠️  OLD CODE: Already claimed error found");
  } else {
    console.log("✅ NEW CODE: Already claimed error NOT found");
  }
}

main().catch(console.error);
