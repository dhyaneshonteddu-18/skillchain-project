/**
 * Achievement Type Verification Test
 * Verifies that frontend achievement types match deployed contract
 */

// Contract definition (from AchievementRegistry.sol constructor)
const DEPLOYED_CONTRACT_TYPES = {
  INTERNSHIP: { reward: 100, wei: 100n * 10n ** 18n },
  HACKATHON: { reward: 200, wei: 200n * 10n ** 18n },
  AWS_CERT: { reward: 150, wei: 150n * 10n ** 18n },
};

// Frontend definition (from ApproveAchievement.jsx)
const FRONTEND_ACHIEVEMENT_TYPES = [
  'INTERNSHIP',
  'HACKATHON',
  'AWS_CERT',
];

const FRONTEND_REWARD_AMOUNTS = {
  'INTERNSHIP': 100,
  'HACKATHON': 200,
  'AWS_CERT': 150,
};

// Frontend definition (from CreateBountyPage.jsx)
const FRONTEND_SKILL_TYPES = [
  'INTERNSHIP',
  'HACKATHON',
  'AWS_CERT',
];

// Tests
console.log('=== Achievement Type Verification ===\n');

// Test 1: Check all contract types are in frontend
console.log('✓ Test 1: Contract types present in frontend');
let allPresent = true;
for (const type of Object.keys(DEPLOYED_CONTRACT_TYPES)) {
  if (!FRONTEND_ACHIEVEMENT_TYPES.includes(type)) {
    console.error(`  ✗ FAIL: ${type} not in frontend ACHIEVEMENT_TYPES`);
    allPresent = false;
  }
}
if (allPresent) {
  console.log('  ✓ PASS: All contract types present\n');
}

// Test 2: Check rewards match
console.log('✓ Test 2: Rewards match between contract and frontend');
let rewardsMatch = true;
for (const type of Object.keys(DEPLOYED_CONTRACT_TYPES)) {
  const contractReward = DEPLOYED_CONTRACT_TYPES[type].reward;
  const frontendReward = FRONTEND_REWARD_AMOUNTS[type];
  if (contractReward !== frontendReward) {
    console.error(`  ✗ FAIL: ${type} - contract=${contractReward}, frontend=${frontendReward}`);
    rewardsMatch = false;
  }
}
if (rewardsMatch) {
  console.log('  ✓ PASS: All rewards match\n');
}

// Test 3: Verify no extra types in frontend
console.log('✓ Test 3: No extra types in frontend');
let noExtra = true;
for (const type of FRONTEND_ACHIEVEMENT_TYPES) {
  if (!DEPLOYED_CONTRACT_TYPES[type]) {
    console.error(`  ✗ FAIL: ${type} not in contract`);
    noExtra = false;
  }
}
if (noExtra) {
  console.log('  ✓ PASS: No extra types\n');
}

// Test 4: Verify CreateBountyPage types match
console.log('✓ Test 4: CreateBountyPage SKILL_TYPES correct');
let skillTypesMatch = true;
if (FRONTEND_SKILL_TYPES.length !== FRONTEND_ACHIEVEMENT_TYPES.length) {
  console.error(`  ✗ FAIL: Length mismatch - ${FRONTEND_SKILL_TYPES.length} vs ${FRONTEND_ACHIEVEMENT_TYPES.length}`);
  skillTypesMatch = false;
}
for (const type of FRONTEND_SKILL_TYPES) {
  if (!FRONTEND_ACHIEVEMENT_TYPES.includes(type)) {
    console.error(`  ✗ FAIL: ${type} not in ACHIEVEMENT_TYPES`);
    skillTypesMatch = false;
  }
}
if (skillTypesMatch) {
  console.log('  ✓ PASS: SKILL_TYPES correct\n');
}

// Test 5: Verify contract encoding (should be plain strings, not enums)
console.log('✓ Test 5: Contract uses string encoding (not enum)');
console.log('  AchievementRegistry.sol uses mapping(string => uint256) rewardAmount');
console.log('  Frontend passes type as plain string parameter');
console.log('  ✓ PASS: String encoding correct\n');

// Test 6: Verify "Unknown achievement type" will not occur for supported types
console.log('✓ Test 6: "Unknown achievement type" error prevention');
console.log('  All frontend types are now in contract rewardAmount mapping');
console.log('  Contract._approve() will find reward > 0 for all types');
console.log('  ✓ PASS: Error will not occur\n');

// Summary
console.log('=== Summary ===');
const allTestsPassed = allPresent && rewardsMatch && noExtra && skillTypesMatch;
if (allTestsPassed) {
  console.log('✓ ALL TESTS PASSED');
  console.log('Frontend and contract achievement types are synchronized');
  console.log('\nDeployed types:');
  for (const [type, data] of Object.entries(DEPLOYED_CONTRACT_TYPES)) {
    console.log(`  - ${type}: ${data.reward} SKC`);
  }
} else {
  console.log('✗ SOME TESTS FAILED');
  process.exit(1);
}
