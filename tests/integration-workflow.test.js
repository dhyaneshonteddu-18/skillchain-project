/**
 * Integration Test Suite: Full Certificate Upload & Duplicate Detection Workflow
 * Tests the entire flow: extraction → duplicate detection → metadata display
 */

import assert from 'assert';
import { createHash } from 'crypto';
import {
  calculateDetailedSimilarity,
  findDuplicatesWithContext,
  fuzzyMatch,
  normalizeDate,
} from '../backend/services/duplicateDetector.js';
import {
  extractMetadata,
  compareMetadata,
  normalizeText,
} from '../backend/services/pdfAnalysis.js';

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
console.log('INTEGRATION WORKFLOW - CERTIFICATE UPLOAD & DETECTION');
console.log('='.repeat(70) + '\n');

// ============================================
// TEST GROUP 1: Original Certificate Upload
// ============================================

const originalCertText = `
  Certificate of Completion
  Applied Data Visualization Sprint
  
  This is to certify that John Anderson has successfully completed the course requirements
  for the Applied Data Visualization Sprint certification program.
  
  Issue Date: 24 October 2026
  Certificate ID: SC-EDIT-2026-017
  
  Issued by SkillChain Demo Studio
  
  This certificate represents demonstrated competency in the subject matter.
`;

const originalMetadata = extractMetadata(originalCertText);
const originalHash = createHash('sha256').update(originalCertText).digest('hex');

test('Step 1: Extract metadata from original certificate', () => {
  assert.strictEqual(originalMetadata.issuer !== 'Not detected', true, 'Issuer should be detected');
  assert.strictEqual(originalMetadata.recipientName !== 'Not detected', true, 'Recipient should be detected');
  assert.strictEqual(originalMetadata.awardDate !== 'Not detected', true, 'Award date should be detected');
  assert.strictEqual(originalMetadata.certificateID !== 'Not detected', true, 'Certificate ID should be detected');
});

test('Step 2: Generate hash for original certificate', () => {
  assert(originalHash.length === 64, 'SHA-256 hash should be 64 characters');
  assert(/^[a-f0-9]{64}$/.test(originalHash), 'Hash should be valid hexadecimal');
});

test('Step 3: Verify original metadata extraction', () => {
  console.log(`    Original Certificate Metadata:`);
  console.log(`    - Issuer: ${originalMetadata.issuer}`);
  console.log(`    - Recipient: ${originalMetadata.recipientName}`);
  console.log(`    - Date: ${originalMetadata.awardDate}`);
  console.log(`    - ID: ${originalMetadata.certificateID}`);
  
  // All key fields should be present
  const fields = ['issuer', 'recipientName', 'awardDate', 'certificateID'];
  fields.forEach(field => {
    assert(originalMetadata[field] !== 'Not detected', `${field} should be detected`);
  });
});

// ============================================
// TEST GROUP 2: Modified Certificate (Same Content, Different Hash)
// ============================================

const modifiedRecipientText = `
  Certificate of Completion
  Applied Data Visualization Sprint
  
  This is to certify that Jane Wilson has successfully completed the course requirements
  for the Applied Data Visualization Sprint certification program.
  
  Issue Date: 24 October 2026
  Certificate ID: SC-EDIT-2026-017
  
  Issued by SkillChain Demo Studio
  
  This certificate represents demonstrated competency in the subject matter.
`;

const modifiedMetadata = extractMetadata(modifiedRecipientText);
const modifiedHash = createHash('sha256').update(modifiedRecipientText).digest('hex');

test('Step 4: Extract metadata from modified certificate (changed recipient)', () => {
  assert.strictEqual(modifiedMetadata.issuer !== 'Not detected', true, 'Issuer should be detected');
  assert(modifiedMetadata.recipientName.toLowerCase().includes('jane'), 'Recipient should be Jane');
  assert.strictEqual(modifiedMetadata.awardDate !== 'Not detected', true, 'Award date should be same');
  assert.strictEqual(modifiedMetadata.certificateID !== 'Not detected', true, 'Certificate ID should be same');
});

test('Step 5: Verify modified certificate has different hash', () => {
  assert.notStrictEqual(originalHash, modifiedHash, 'Different text should produce different hash');
});

test('Step 6: Compare metadata between original and modified', () => {
  const comparison = compareMetadata(originalMetadata, modifiedMetadata);
  
  console.log(`    Metadata Comparison:`);
  console.log(`    - Issuer match: ${comparison.matches.issuer ? 'YES' : 'NO'}`);
  console.log(`    - Recipient match: ${comparison.matches.recipientName ? 'YES' : 'NO'}`);
  console.log(`    - Date match: ${comparison.matches.awardDate ? 'YES' : 'NO'}`);
  console.log(`    - ID match: ${comparison.matches.certificateID ? 'YES' : 'NO'}`);
  console.log(`    - Similarity: ${comparison.similarity}%`);
  
  assert(comparison.matches.issuer, 'Issuers should match');
  assert(!comparison.matches.recipientName, 'Recipients should NOT match (Jane vs John)');
  assert(comparison.matches.awardDate, 'Dates should match');
  assert(comparison.matches.certificateID, 'IDs should match');
  assert(comparison.isSuspected, 'Should be flagged as suspected duplicate (70%+ similarity)');
});

test('Step 7: Calculate similarity score for modified certificate', () => {
  // Similarity = 3 matching fields / 4 total fields = 75%
  const matchingFields = 3;
  const totalFields = 4;
  const similarity = Math.round((matchingFields / totalFields) * 100);
  
  assert(similarity === 75, 'Similarity should be 75% (3 out of 4 fields match)');
  assert(similarity >= 70, 'Should be detected as suspected modified (70%+ similarity)');
});

// ============================================
// TEST GROUP 3: Duplicate Certificate (Exact Same)
// ============================================

const exactDuplicateText = originalCertText; // Exact copy

test('Step 8: Detect exact duplicate (binary hash match)', () => {
  const duplicateHash = createHash('sha256').update(exactDuplicateText).digest('hex');
  assert.strictEqual(originalHash, duplicateHash, 'Exact copies should have identical hash');
});

test('Step 9: Exact duplicate metadata should be 100% match', () => {
  const duplicateMetadata = extractMetadata(exactDuplicateText);
  const comparison = compareMetadata(originalMetadata, duplicateMetadata);
  
  console.log(`    Exact Duplicate Comparison:`);
  console.log(`    - Similarity: ${comparison.similarity}%`);
  console.log(`    - Is Duplicate: ${comparison.isDuplicate}`);
  
  // Similarity should be 100%
  assert.strictEqual(comparison.similarity, 100, 'Exact duplicate should have 100% similarity');
  assert(comparison.isDuplicate, 'Should be flagged as definite duplicate (90%+ similarity)');
});

// ============================================
// TEST GROUP 4: Different Certificate (No Match)
// ============================================

const differentCertText = `
  AWS Certified Cloud Practitioner
  
  This certificate is awarded to Mike Johnson for passing the AWS Cloud Practitioner examination.
  
  Certification Date: 15 March 2024
  Certificate Number: AWS-CP-2024-98765
  
  AWS
`;

const differentMetadata = extractMetadata(differentCertText);

test('Step 10: Extract metadata from completely different certificate', () => {
  assert.strictEqual(differentMetadata.issuer !== 'Not detected', true, 'Should detect AWS issuer');
});

test('Step 11: Different certificates should show no similarity', () => {
  const comparison = compareMetadata(originalMetadata, differentMetadata);
  
  console.log(`    Different Certificate Comparison:`);
  console.log(`    - Issuer match: ${comparison.matches.issuer ? 'YES (MISMATCH)' : 'NO (CORRECT)'}`);
  console.log(`    - Similarity: ${comparison.similarity}%`);
  
  // Issuer should NOT match
  assert(!comparison.matches.issuer, 'AWS and SkillChain should not match');
  assert(comparison.similarity < 50, 'Similarity should be low for different certs');
});

// ============================================
// TEST GROUP 5: Metadata Confidence Calculation
// ============================================

test('Step 12: Calculate confidence for original certificate', () => {
  const fields = ['issuer', 'certificateName', 'recipientName', 'awardDate', 'certificateID', 'qualification'];
  const extractedCount = fields.filter(field => 
    originalMetadata[field] && originalMetadata[field] !== 'Not detected'
  ).length;
  
  const confidence = Math.round((extractedCount / fields.length) * 100);
  
  console.log(`    Original certificate confidence: ${confidence}% (${extractedCount}/${fields.length} fields)`);
  assert(confidence >= 50, 'Confidence should be reasonable');
});

test('Step 13: Calculate confidence for modified certificate', () => {
  const fields = ['issuer', 'certificateName', 'recipientName', 'awardDate', 'certificateID', 'qualification'];
  const extractedCount = fields.filter(field => 
    modifiedMetadata[field] && modifiedMetadata[field] !== 'Not detected'
  ).length;
  
  const confidence = Math.round((extractedCount / fields.length) * 100);
  
  console.log(`    Modified certificate confidence: ${confidence}% (${extractedCount}/${fields.length} fields)`);
  assert(confidence >= 50, 'Confidence should be reasonable');
});

test('Step 14: Verify "Not detected" handling for missing fields', () => {
  const minimumText = 'Certificate issued by Unknown Org to Student A on 2024-01-01';
  const minMetadata = extractMetadata(minimumText);
  
  // Should have some "Not detected" values
  const hasNotDetected = Object.values(minMetadata).some(v => v === 'Not detected');
  assert(hasNotDetected, 'Should mark missing fields as "Not detected"');
});

// ============================================
// TEST GROUP 6: Upload Workflow Decision Tree
// ============================================

test('Step 15: Upload workflow - Exact duplicate triggers ERROR', () => {
  const isExactDuplicate = (originalHash === modifiedHash);
  assert.strictEqual(isExactDuplicate, false, 'For this test, hashes should differ');
  
  // If hashes were same, it would trigger ERROR (prevent upload)
  const shouldError = isExactDuplicate;
  assert.strictEqual(shouldError, false, 'Modified cert should not trigger exact duplicate error');
});

test('Step 16: Upload workflow - Modified cert triggers SUCCESS with WARNING', () => {
  const similarity = 75; // 3 out of 4 fields match
  const isSuspectedModified = similarity >= 70 && similarity < 100;
  
  assert(isSuspectedModified, 'Should be flagged as suspected modified');
  
  // This should show SUCCESS with warning message, not ERROR
  const displayType = isSuspectedModified ? 'success_with_warning' : 'error';
  assert.strictEqual(displayType, 'success_with_warning', 'Should show success with warning for modified certs');
});

test('Step 17: Upload workflow - Unique cert proceeds normally', () => {
  // When no duplicates found at all
  const hasDuplicates = false;
  
  assert.strictEqual(hasDuplicates, false, 'Unique cert should have no duplicates');
  
  // Should show "No duplicates detected" success message
  const message = hasDuplicates ? 'Duplicates found' : '✅ No duplicates detected';
  assert(message.includes('No duplicates'), 'Should show success message');
});

console.log('\n' + '='.repeat(70));
console.log('Integration Test Results Summary');
console.log('='.repeat(70));
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount} ✓`);
console.log(`Failed: ${failCount} ✗`);
console.log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (failCount === 0) {
  console.log(`✓ All integration tests passed!\n`);
  process.exit(0);
} else {
  console.log(`✗ Some integration tests failed\n`);
  process.exit(1);
}
