const ethers = require('ethers');

const AMOY_RPC = 'https://rpc-amoy.polygon.technology';
const REGISTRY_ADDRESS = '0xFF4cACB5C57a136ea2422cCdC275d494aad6a1fD';

async function checkContract() {
  const provider = new ethers.JsonRpcProvider(AMOY_RPC);
  
  const code = await provider.getCode(REGISTRY_ADDRESS);
  console.log('Contract bytecode length:', code.length);
  
  // Check if "Already claimed" string is in the bytecode (hex: 416c726561647920636c61696d6564)
  if (code.includes('416c726561647920636c61696d6564')) {
    console.log('⚠️ OLD CODE DETECTED: "Already claimed" error message found');
  } else {
    console.log('✅ NEW CODE DETECTED: "Already claimed" string NOT found');
  }
}

checkContract().catch(console.error);
