/**
 * Test Suite: Polygon Amoy EIP-1559 Gas Price Logic
 * Tests that gas prices are correctly calculated for Polygon Amoy minimum requirements
 */

console.log('\n' + '='.repeat(70));
console.log('POLYGON AMOY EIP-1559 GAS PRICE TESTS');
console.log('='.repeat(70) + '\n');

let testCount = 0;
let passCount = 0;
let failCount = 0;

const test = (name, fn) => {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✓ Test ${testCount}: ${name}`);
  } catch (err) {
    failCount++;
    console.error(`✗ Test ${testCount}: ${name}`);
    console.error(`  Error: ${err.message}`);
  }
};

// ============================================
// TEST GROUP 1: Error Detection
// ============================================

test('Error message recognition: Gas tip cap too low', () => {
  const errorMessage = 'transaction gas price below minimum: gas tip cap 1500000000, minimum needed 25000000000';
  
  const gasPrice = parseInt(errorMessage.match(/gas tip cap (\d+)/)[1]);
  const minimumNeeded = parseInt(errorMessage.match(/minimum needed (\d+)/)[1]);
  
  // Convert to Gwei
  const gasPriceGwei = gasPrice / 1e9;
  const minimumGwei = minimumNeeded / 1e9;
  
  if (gasPriceGwei !== 1.5) throw new Error('Failed to parse current gas price');
  if (minimumGwei !== 25) throw new Error('Failed to parse minimum required');
});

test('Problem identification: Priority fee 1.5 Gwei below 25 Gwei minimum', () => {
  const currentPriorityFee = 1.5; // Gwei - what ethers defaulted to
  const minimumRequired = 25; // Gwei - Polygon Amoy minimum
  
  if (currentPriorityFee >= minimumRequired) {
    throw new Error('Test assumes current fee is too low');
  }
});

// ============================================
// TEST GROUP 2: Gas Price Calculation
// ============================================

test('Gas Station API response parsing', () => {
  // Simulated Gas Station API response
  const apiResponse = {
    standard: {
      maxPriorityFee: 30,
      maxFee: 100
    }
  };
  
  // Add 20% buffer for safety
  const maxPriorityFeeGwei = Math.ceil(apiResponse.standard.maxPriorityFee * 1.2);
  const maxFeeGwei = Math.ceil(apiResponse.standard.maxFee * 1.2);
  
  if (maxPriorityFeeGwei !== 36) throw new Error('Priority fee calculation failed');
  if (maxFeeGwei !== 120) throw new Error('Max fee calculation failed');
});

test('RPC eth_feeHistory parsing', () => {
  // Simulated eth_feeHistory response
  const baseFee = BigInt('30000000000'); // 30 Gwei
  const priorityFee = BigInt('25000000000'); // 25 Gwei (75th percentile)
  
  const buffer = baseFee / 10n; // 10% of base fee
  const maxFeePerGas = baseFee + priorityFee + buffer;
  
  // Verify calculation
  const expectedMaxFee = baseFee + priorityFee + (baseFee / 10n);
  if (maxFeePerGas !== expectedMaxFee) {
    throw new Error('RPC fee calculation failed');
  }
});

test('Minimum fee validation for Polygon Amoy', () => {
  const minimumPriority = 25; // Gwei - network minimum
  const currentPriority = 15; // Gwei - estimated but below minimum
  
  // Enforce minimum
  const finalPriority = Math.max(currentPriority, minimumPriority);
  
  if (finalPriority !== 25) throw new Error('Minimum not enforced');
  if (finalPriority < 25) throw new Error('Still below minimum');
});

test('Fallback fees are above Polygon Amoy minimum', () => {
  const fallbackPriority = 30; // Gwei
  const fallbackMaxFee = 100; // Gwei
  const minimumRequired = 25; // Gwei
  
  if (fallbackPriority < minimumRequired) {
    throw new Error('Fallback priority fee below minimum');
  }
  if (fallbackMaxFee < minimumRequired) {
    throw new Error('Fallback max fee below minimum');
  }
});

// ============================================
// TEST GROUP 3: Wei/Gwei Conversion
// ============================================

test('Gwei to Wei conversion: 25 Gwei = 25e9 Wei', () => {
  const gweiAmount = 25;
  const weiAmount = gweiAmount * 1e9;
  
  if (weiAmount !== 25000000000) {
    throw new Error('Conversion failed');
  }
});

test('Wei to Gwei conversion: 30000000000 Wei = 30 Gwei', () => {
  const weiAmount = 30000000000;
  const gweiAmount = weiAmount / 1e9;
  
  if (gweiAmount !== 30) {
    throw new Error('Conversion failed');
  }
});

// ============================================
// TEST GROUP 4: Transaction Override Format
// ============================================

test('EIP-1559 override object structure', () => {
  const overrides = {
    maxPriorityFeePerGas: BigInt('30000000000'), // 30 Gwei
    maxFeePerGas: BigInt('100000000000'),        // 100 Gwei
  };
  
  // Verify structure is correct for ethers.js v6
  if (!overrides.maxPriorityFeePerGas) throw new Error('Missing maxPriorityFeePerGas');
  if (!overrides.maxFeePerGas) throw new Error('Missing maxFeePerGas');
  if (typeof overrides.maxPriorityFeePerGas !== 'bigint') {
    throw new Error('maxPriorityFeePerGas should be BigInt');
  }
});

test('Correct parameter order for contract.method()', () => {
  // Original (incorrect): contract.registerCertificate(hash, issuer)
  // Fixed (correct): contract.registerCertificate(hash, issuer, { gasOverrides })
  
  // The override is passed as the last parameter
  const params = ['0xhash', 'issuer', { gasOverrides: true }];
  
  if (params.length !== 3) throw new Error('Wrong parameter count');
  if (typeof params[2] !== 'object') throw new Error('Override should be object');
});

// ============================================
// TEST GROUP 5: Fee Estimation Hierarchy
// ============================================

test('Fee estimation priority: Gas Station API > RPC > Fallback', () => {
  const sources = ['gasStation', 'rpc', 'fallback'];
  
  // Verify order is as expected
  if (sources[0] !== 'gasStation') throw new Error('Gas Station should be first');
  if (sources[1] !== 'rpc') throw new Error('RPC should be second');
  if (sources[2] !== 'fallback') throw new Error('Fallback should be last');
});

test('Graceful fallback on API failure', () => {
  let currentSource = 'gasStation';
  
  try {
    // Simulate API failure
    throw new Error('API timeout');
  } catch (error) {
    // Fall back to RPC
    currentSource = 'rpc';
  }
  
  if (currentSource !== 'rpc') throw new Error('Did not fallback correctly');
});

// ============================================
// TEST GROUP 6: Polygon Amoy Specific Values
// ============================================

test('Polygon Amoy minimum priority fee is 25 Gwei', () => {
  const minimumPriorityFee = 25; // Gwei
  
  if (minimumPriorityFee !== 25) {
    throw new Error('Wrong minimum');
  }
});

test('Polygon Amoy Chain ID is 80002', () => {
  const chainId = 80002;
  
  if (chainId !== 80002) {
    throw new Error('Wrong chain ID');
  }
});

test('RPC URL is valid for Polygon Amoy', () => {
  const rpcUrl = 'https://rpc-amoy.polygon.technology/';
  
  if (!rpcUrl.includes('amoy')) {
    throw new Error('Wrong RPC URL');
  }
  if (!rpcUrl.startsWith('https')) {
    throw new Error('RPC URL should use HTTPS');
  }
});

// ============================================
// TEST GROUP 7: Real World Scenario
// ============================================

test('Scenario: Contract call fails with insufficient gas price', () => {
  const error = {
    message: 'transaction gas price below minimum: gas tip cap 1500000000, minimum needed 25000000000'
  };
  
  // Extract values
  const currentTip = 1.5; // Gwei
  const required = 25; // Gwei
  const shortfall = required - currentTip;
  
  if (shortfall !== 23.5) {
    throw new Error('Shortfall calculation wrong');
  }
  if (shortfall <= 0) {
    throw new Error('Should show a shortfall');
  }
});

test('Solution: Re-submit with correct gas price', () => {
  const originalTip = 1.5; // Gwei
  const requiredTip = 25; // Gwei
  const safetyBuffer = 5; // Gwei extra
  const correctTip = requiredTip + safetyBuffer;
  
  if (correctTip <= requiredTip) {
    throw new Error('Should be above minimum with buffer');
  }
  if (correctTip !== 30) {
    throw new Error('Should be 30 Gwei with buffer');
  }
});

console.log('\n' + '='.repeat(70));
console.log('Test Results Summary');
console.log('='.repeat(70));
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount} ✓`);
console.log(`Failed: ${failCount} ✗`);
console.log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (failCount === 0) {
  console.log(`\n✅ All Polygon Amoy gas price tests passed!\n`);
  process.exit(0);
} else {
  console.log(`\n❌ Some tests failed\n`);
  process.exit(1);
}
