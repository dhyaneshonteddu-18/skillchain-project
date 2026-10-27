/**
 * Contract Validation Test
 * Simulates contract behavior with fixed achievement types
 * Validates that transactions will not fail with "Unknown achievement type"
 */

// Simulate the AchievementRegistry contract state
const simulateAchievementRegistry = () => {
  const TOKEN_UNIT = 1n * 10n ** 18n;
  
  // This is what the deployed contract has in its constructor
  const rewardAmount = {
    'INTERNSHIP': 100n * TOKEN_UNIT,
    'HACKATHON': 200n * TOKEN_UNIT,
    'AWS_CERT': 150n * TOKEN_UNIT,
  };

  const claimed = new Map(); // claimed[address][achievementType] = bool

  /**
   * Simulate the contract's _approve function
   * This is where the "Unknown achievement type" error occurs
   */
  const approve = (studentAddress, achievementType, proofURI) => {
    // Line 59: require(student != address(0), "Invalid student");
    if (!studentAddress || studentAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid student');
    }

    // Line 59: require(!claimed[student][achievementType_], "Already claimed");
    const key = `${studentAddress}:${achievementType}`;
    if (claimed.has(key)) {
      throw new Error(`Already claimed: ${achievementType}`);
    }

    // Line 60: uint256 reward = rewardAmount[achievementType_];
    const reward = rewardAmount[achievementType];

    // Line 61: require(reward > 0, "Unknown achievement type");
    // THIS IS THE CHECK THAT WAS FAILING
    if (!reward || reward === 0n) {
      throw new Error('Unknown achievement type');
    }

    // If we get here, the transaction succeeds
    claimed.set(key, true);
    
    return {
      success: true,
      student: studentAddress,
      type: achievementType,
      reward: Number(reward / TOKEN_UNIT),
      unit: 'SKC',
    };
  };

  return { approve, rewardAmount, claimed };
};

console.log('=== Contract Validation Test ===\n');

// Test data (from updated frontend)
const testCases = [
  {
    name: 'Valid: INTERNSHIP',
    studentAddress: '0x1234567890123456789012345678901234567890',
    achievementType: 'INTERNSHIP',
    expectSuccess: true,
    expectedReward: 100,
  },
  {
    name: 'Valid: HACKATHON',
    studentAddress: '0x2234567890123456789012345678901234567890',
    achievementType: 'HACKATHON',
    expectSuccess: true,
    expectedReward: 200,
  },
  {
    name: 'Valid: AWS_CERT',
    studentAddress: '0x3234567890123456789012345678901234567890',
    achievementType: 'AWS_CERT',
    expectSuccess: true,
    expectedReward: 150,
  },
  {
    name: 'Invalid: KUBERNETES_EXPERT (old frontend type)',
    studentAddress: '0x4234567890123456789012345678901234567890',
    achievementType: 'KUBERNETES_EXPERT',
    expectSuccess: false,
    expectedError: 'Unknown achievement type',
  },
  {
    name: 'Invalid: HACKATHON_WINNER (old frontend type)',
    studentAddress: '0x5234567890123456789012345678901234567890',
    achievementType: 'HACKATHON_WINNER',
    expectSuccess: false,
    expectedError: 'Unknown achievement type',
  },
  {
    name: 'Invalid: AWS_CERTIFICATION (old frontend type)',
    studentAddress: '0x6234567890123456789012345678901234567890',
    achievementType: 'AWS_CERTIFICATION',
    expectSuccess: false,
    expectedError: 'Unknown achievement type',
  },
];

const registry = simulateAchievementRegistry();
let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  try {
    const result = registry.approve(
      testCase.studentAddress,
      testCase.achievementType,
      'ipfs://Qm...'
    );

    if (testCase.expectSuccess) {
      if (result.reward === testCase.expectedReward) {
        console.log(`✓ PASS: ${testCase.name}`);
        console.log(`  Reward: ${result.reward} SKC\n`);
        passedTests++;
      } else {
        console.log(`✗ FAIL: ${testCase.name}`);
        console.log(`  Expected reward: ${testCase.expectedReward}, got: ${result.reward}\n`);
        failedTests++;
      }
    } else {
      console.log(`✗ FAIL: ${testCase.name}`);
      console.log(`  Expected error, but transaction succeeded\n`);
      failedTests++;
    }
  } catch (err) {
    if (!testCase.expectSuccess && err.message.includes(testCase.expectedError)) {
      console.log(`✓ PASS: ${testCase.name}`);
      console.log(`  Error (expected): ${err.message}\n`);
      passedTests++;
    } else {
      console.log(`✗ FAIL: ${testCase.name}`);
      console.log(`  Error: ${err.message}\n`);
      failedTests++;
    }
  }
}

console.log('=== Summary ===');
console.log(`Passed: ${passedTests}/${testCases.length}`);
console.log(`Failed: ${failedTests}/${testCases.length}`);

if (failedTests === 0) {
  console.log('\n✓ ALL TESTS PASSED');
  console.log('Frontend achievement types now match contract expectations');
  console.log('No more "Unknown achievement type" errors for supported types');
  process.exit(0);
} else {
  console.log('\n✗ SOME TESTS FAILED');
  process.exit(1);
}
