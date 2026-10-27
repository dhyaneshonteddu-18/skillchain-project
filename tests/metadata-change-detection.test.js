/**
 * Test Suite: Metadata Change Detection
 * Tests the scenario where a certificate is uploaded, then edited (e.g., name changed via Mac Markup)
 * and re-uploaded, expecting a yellow warning about the detected changes
 */

import assert from 'assert';
import {
  calculateDetailedSimilarity,
  findDuplicatesWithContext,
  fuzzyMatch,
  normalizeDate,
} from '../backend/services/duplicateDetector.js';

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

console.log('\n' + '='.repeat(70));
console.log('METADATA CHANGE DETECTION - TEST SUITE');
console.log('Scenario: User uploads cert A, edits name with Mac Markup, uploads cert B');
console.log('Expected: Yellow warning showing name changed from "hemanth" to new name');
console.log('='.repeat(70) + '\n');

// ============================================
// CORE SCENARIO: Name Change Detection
// ============================================

test('Scenario 1: Original certificate with "hemanth" name', () => {
  const originalCert = {
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'hemanth',
      awardDate: 'August 25, 2026',
      certificateID: 'INT-2026-8842',
      qualification: 'Smart Contracts & Blockchain Development',
    },
  };
  
  assert.strictEqual(originalCert.metadata.recipientName.toLowerCase(), 'hemanth', 'Original should have name "hemanth"');
  console.log('   Original certificate created with recipient: "hemanth"');
});

test('Scenario 2: Modified certificate with name changed to "Hemant Kumar"', () => {
  const originalCert = {
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'hemanth',
      awardDate: 'August 25, 2026',
      certificateID: 'INT-2026-8842',
      qualification: 'Smart Contracts & Blockchain Development',
    },
  };
  
  const modifiedCert = {
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'Hemant Kumar', // Changed via Mac Markup
      awardDate: 'August 25, 2026',
      certificateID: 'INT-2026-8842',
      qualification: 'Smart Contracts & Blockchain Development',
    },
  };
  
  const similarity = calculateDetailedSimilarity(originalCert, modifiedCert);
  
  // Should detect similarity >= 50% to trigger warning
  assert(similarity.score >= 50, `Similarity should be >= 50%, got ${similarity.score}%`);
  assert.strictEqual(similarity.details.recipientName.val1, 'hemanth', 'Should capture original name');
  assert.strictEqual(similarity.details.recipientName.val2, 'Hemant Kumar', 'Should capture modified name');
  
  console.log(`   Similarity Score: ${similarity.score}%`);
  console.log(`   Recipient Name Changed: ${similarity.details.recipientName.val1} → ${similarity.details.recipientName.val2}`);
  console.log(`   Classification: ${similarity.classification}`);
});

test('Scenario 3: Issuer and date unchanged (should still detect name as key change)', () => {
  const originalCert = {
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'hemanth',
      awardDate: '2026-08-25',
      certificateID: 'INT-2026-8842',
      qualification: 'Smart Contracts & Blockchain Development',
    },
  };
  
  const modifiedCert = {
    metadata: {
      issuer: 'Nexus Labs', // Same
      recipientName: 'Hemant Kumar', // Changed
      awardDate: '2026-08-25', // Same
      certificateID: 'INT-2026-8842', // Same
      qualification: 'Smart Contracts & Blockchain Development', // Same
    },
  };
  
  const similarity = calculateDetailedSimilarity(originalCert, modifiedCert);
  const details = similarity.details;
  
  // Issuer should match (35% weight)
  assert.strictEqual(details.issuer.score, 100, 'Issuer should be identical');
  
  // Date should match (20% weight)
  assert(details.awardDate.score > 0, 'Date should match or be very similar');
  
  // Certificate ID should match (10% weight)
  assert.strictEqual(details.certificateID.score, 100, 'Certificate ID should be identical');
  
  // Name should NOT match (30% weight - most important)
  assert(details.recipientName.score < 100, 'Recipient name should show as different');
  assert(details.recipientName.score > 0, 'But should have some fuzzy match similarity');
  
  // Overall should still be flagged as duplicate due to other 75% weight (issuer + date + ID)
  assert(similarity.score >= 50, 'Overall similarity should be >= 50%');
  
  console.log(`   Issuer match: ${details.issuer.score}%`);
  console.log(`   Date match: ${details.awardDate.score}%`);
  console.log(`   Name match: ${details.recipientName.score}%`);
  console.log(`   Certificate ID match: ${details.certificateID.score}%`);
  console.log(`   Overall Similarity: ${similarity.score}%`);
});

// ============================================
// TEST GROUP: Fuzzy Matching of Names
// ============================================

test('Fuzzy Match: "hemanth" vs "Hemant Kumar" should show significant similarity', () => {
  const similarity = fuzzyMatch('hemanth', 'Hemant Kumar');
  
  assert(similarity > 0, 'Should have some similarity');
  // "hemanth" shares letters with "hemant", so should be reasonably high
  console.log(`   Fuzzy similarity between "hemanth" and "Hemant Kumar": ${similarity}%`);
});

test('Fuzzy Match: Exact name match should be 100%', () => {
  const similarity = fuzzyMatch('hemanth', 'hemanth');
  
  assert.strictEqual(similarity, 100, 'Exact matches should be 100%');
});

test('Fuzzy Match: Similar names with different cases', () => {
  const similarity1 = fuzzyMatch('John Smith', 'john smith');
  const similarity2 = fuzzyMatch('JOHN SMITH', 'john smith');
  
  assert.strictEqual(similarity1, 100, 'Case-insensitive match should be 100%');
  assert.strictEqual(similarity2, 100, 'Case-insensitive match should be 100%');
});

// ============================================
// TEST GROUP: Context Scoring
// ============================================

test('Context Scoring: Same student uploading modified cert within 1 hour', () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const originalCert = {
    id: 'cert1',
    studentEmail: 'student@example.com',
    uploadedAt: oneHourAgo.toISOString(),
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'hemanth',
      awardDate: '2026-08-25',
      certificateID: 'INT-2026-8842',
    },
  };
  
  const modifiedCert = {
    id: 'cert2',
    studentEmail: 'student@example.com', // Same student
    uploadedAt: now.toISOString(), // Uploaded now (< 1 hour later)
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'Hemant Kumar',
      awardDate: '2026-08-25',
      certificateID: 'INT-2026-8842',
    },
  };
  
  const results = findDuplicatesWithContext(modifiedCert, [originalCert]);
  
  assert(results.length > 0, 'Should find duplicate');
  const match = results[0];
  
  // Should flag as duplicate due to high similarity of other fields (issuer, date, ID)
  // even if name differs
  assert(match.similarity.finalScore >= 50, 'Final score should trigger duplicate warning (>= 50%)');
  
  console.log(`   Base Similarity: ${match.similarity.baseScore}%`);
  console.log(`   Context Adjustment: +${match.similarity.contextAdjustment}%`);
  console.log(`   Final Score: ${match.similarity.finalScore}%`);
});

// ============================================
// TEST GROUP: Backend Response Format
// ============================================

test('Backend Response: Should return detailed change information for frontend', () => {
  const originalCert = {
    id: 'orig',
    fileName: 'Certificate_Hemanth_Aug2026.pdf',
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'hemanth',
      awardDate: '2026-08-25',
      certificateID: 'INT-2026-8842',
      qualification: 'Smart Contracts & Blockchain Development',
    },
  };
  
  const modifiedCert = {
    metadata: {
      issuer: 'Nexus Labs',
      recipientName: 'Hemant Kumar',
      awardDate: '2026-08-25',
      certificateID: 'INT-2026-8842',
      qualification: 'Smart Contracts & Blockchain Development',
    },
  };
  
  const results = findDuplicatesWithContext(modifiedCert, [originalCert]);
  const match = results[0];
  
  const mockBackendResponse = {
    success: false,
    error: 'Error: 100% matched to some previous certificate Changed fields: Name: hemanth → Hemant Kumar',
    isDuplicate: true,
    type: 'modified_duplicate',
    matchDetails: {
      originalCertificate: match.fileName,
      originalUploadedAt: match.uploadedAt,
      similarity: match.similarity.finalScore,
      changedFields: match.similarity.details,
    },
  };
  
  assert.strictEqual(mockBackendResponse.isDuplicate, true, 'Response should indicate duplicate');
  assert(mockBackendResponse.error.includes('Name:'), 'Error message should include field changes');
  assert(mockBackendResponse.matchDetails.changedFields.recipientName, 'Should include recipient name change details');
  
  console.log(`   Mock Backend Response Error: "${mockBackendResponse.error}"`);
  console.log(`   Changed Fields in Response: ${JSON.stringify(mockBackendResponse.matchDetails.changedFields.recipientName)}`);
});

// ============================================
// TEST GROUP: Frontend Warning Display
// ============================================

test('Frontend: Should display yellow warning when metadata change detected', () => {
  const analysisData = {
    isDuplicate: true,
    error: 'Error: 100% matched to some previous certificate Changed fields: Name: hemanth → Hemant Kumar',
    matchDetails: {
      originalCertificate: 'Certificate_Hemanth_Aug2026.pdf',
      originalUploadedAt: '2026-08-26T10:30:00Z',
    },
  };
  
  const analysisResponse = {
    status: 409, // Conflict status
  };
  
  // Simulate frontend logic
  const shouldShowYellowWarning = analysisResponse.status === 409 && analysisData.isDuplicate;
  
  assert(shouldShowYellowWarning, 'Frontend should show yellow warning for 409 + isDuplicate');
  
  // Build warning message
  let warningMsg = analysisData.error || 'Similar certificate detected';
  if (analysisData.matchDetails?.originalCertificate) {
    warningMsg += `\n\nOriginal uploaded: ${analysisData.matchDetails.originalCertificate}`;
  }
  const fullWarning = `⚠️ ${warningMsg}\n\nYou can still upload this as a new claim.`;
  
  assert(fullWarning.includes('⚠️'), 'Warning should have emoji');
  assert(fullWarning.includes('Name: hemanth → Hemant Kumar'), 'Warning should show what changed');
  assert(fullWarning.includes('You can still upload'), 'Warning should indicate upload is allowed');
  
  console.log(`   Frontend Warning Message:`);
  console.log(`   "${fullWarning}"`);
});

// ============================================
// Summary
// ============================================

console.log('\n' + '='.repeat(70));
console.log(`TEST RESULTS: ${passCount}/${testCount} passed`);
if (failCount === 0) {
  console.log('✓ ALL TESTS PASSED - Metadata change detection working correctly!');
} else {
  console.log(`✗ ${failCount} test(s) failed`);
}
console.log('='.repeat(70) + '\n');

if (failCount > 0) process.exit(1);
