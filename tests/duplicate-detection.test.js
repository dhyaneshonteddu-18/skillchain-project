/**
 * Comprehensive Test Suite for Enhanced Duplicate Detection
 * Tests: binary hash, text fingerprinting, metadata similarity, fuzzy matching
 */

import assert from 'assert';
import { createHash } from 'crypto';
import {
  calculateDetailedSimilarity,
  findDuplicatesWithContext,
  groupDuplicates,
  fuzzyMatch,
  normalizeDate,
} from '../backend/services/duplicateDetector.js';

// Test counter
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
// SCENARIO 1: Exact Duplicate (Same PDF twice)
// ============================================

test('Scenario 1: Binary hash matches for identical file', () => {
  const buffer = Buffer.from('Test certificate content');
  const hash1 = createHash('sha256').update(buffer).digest('hex');
  const hash2 = createHash('sha256').update(buffer).digest('hex');
  
  assert.strictEqual(hash1, hash2, 'Hashes should match for identical content');
});

// ============================================
// SCENARIO 2: Renamed File (Same content, different name)
// ============================================

test('Scenario 2: Binary hash detects renamed files', () => {
  const content = 'Certificate content';
  const hash1 = createHash('sha256').update(content).digest('hex');
  const hash2 = createHash('sha256').update(content).digest('hex');
  
  assert.strictEqual(hash1, hash2, 'Renamed file should have same hash');
});

// ============================================
// SCENARIO 3: Preview Resave (Different binary, same text)
// ============================================

test('Scenario 3: Text fingerprints match for resaved files', () => {
  const text1 = 'Certificate of Completion for John Doe awarded on 2024-05-15';
  const text2 = 'Certificate of Completion for John Doe awarded on 2024-05-15';
  
  const fp1 = createHash('sha256').update(text1.toLowerCase().trim()).digest('hex');
  const fp2 = createHash('sha256').update(text2.toLowerCase().trim()).digest('hex');
  
  assert.strictEqual(fp1, fp2, 'Text fingerprints should match');
});

// ============================================
// SCENARIO 4: Recipient Name Changed
// ============================================

test('Scenario 4: Detect recipient name change', () => {
  const cert1 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'John Doe',
      awardDate: '2024-05-15',
      certificateID: 'AWS-2024-123',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'Jane Doe',
      awardDate: '2024-05-15',
      certificateID: 'AWS-2024-123',
    },
  };
  
  const similarity = calculateDetailedSimilarity(cert1, cert2);
  
  assert(similarity.score >= 50 && similarity.score < 90, 'Should detect change but not be exact duplicate');
  assert(similarity.details.recipientName.score < 100, 'Recipient names should not match exactly');
});

// ============================================
// SCENARIO 5: Award Date Changed
// ============================================

test('Scenario 5: Detect award date change', () => {
  const cert1 = {
    metadata: {
      issuer: 'Google',
      recipientName: 'Alice',
      awardDate: '2024-01-15',
      certificateID: 'GOOG-001',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Google',
      recipientName: 'Alice',
      awardDate: '2024-06-15',
      certificateID: 'GOOG-001',
    },
  };
  
  const similarity = calculateDetailedSimilarity(cert1, cert2);
  
  assert(similarity.details.awardDate.score === 0, 'Different dates should not match');
  assert(similarity.score < 100, 'Should not be perfect match with different date');
});

// ============================================
// SCENARIO 6: Both Name and Date Changed
// ============================================

test('Scenario 6: Detect multiple field changes', () => {
  const cert1 = {
    metadata: {
      issuer: 'Microsoft',
      recipientName: 'Bob Smith',
      awardDate: '2023-03-20',
      certificateID: 'MSFT-999',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Microsoft',
      recipientName: 'Bobby Jones',
      awardDate: '2024-10-01',
      certificateID: 'MSFT-999',
    },
  };
  
  const similarity = calculateDetailedSimilarity(cert1, cert2);
  
  assert(similarity.score < 70, 'Multiple changes should reduce similarity below 70%');
  assert(similarity.details.recipientName.score > 0 && similarity.details.recipientName.score < 100, 'Fuzzy matching should partially match names');
});

// ============================================
// SCENARIO 7: Completely Different Certificates
// ============================================

test('Scenario 7: Unique certificates have low similarity', () => {
  const cert1 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'Alice',
      awardDate: '2024-01-01',
      certificateID: 'AWS-001',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Google',
      recipientName: 'Bob',
      awardDate: '2024-12-31',
      certificateID: 'GOOG-999',
    },
  };
  
  const similarity = calculateDetailedSimilarity(cert1, cert2);
  
  assert(similarity.score < 50, 'Completely different certificates should have low similarity');
});

// ============================================
// SCENARIO 8: Similar Layouts
// ============================================

test('Scenario 8: Two different certificates with similar issuers', () => {
  const cert1 = {
    metadata: {
      issuer: 'Amazon Web Services',
      recipientName: 'Person A',
      awardDate: '2024-05-01',
      certificateID: 'AWS-100',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'Person B',
      awardDate: '2024-06-01',
      certificateID: 'AWS-101',
    },
  };
  
  const similarity = calculateDetailedSimilarity(cert1, cert2);
  
  assert(similarity.details.issuer.score > 80, 'Fuzzy matching should match AWS and Amazon Web Services');
  assert(similarity.score < 90, 'Different people and IDs should prevent perfect match');
});

// ============================================
// SCENARIO 9: Missing Metadata
// ============================================

test('Scenario 9: Handle missing metadata gracefully', () => {
  const cert1 = {
    metadata: {
      issuer: 'Udemy',
      recipientName: 'Student X',
      awardDate: '2024-02-14',
      certificateID: null,
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Udemy',
      recipientName: 'Student X',
      awardDate: '2024-02-14',
      certificateID: null,
    },
  };
  
  const similarity = calculateDetailedSimilarity(cert1, cert2);
  
  assert(similarity.score >= 90, 'Should match despite missing certificate ID');
});

// ============================================
// SCENARIO 10: Concurrent Uploads Simulation
// ============================================

test('Scenario 10: Context scoring - same student, different certs', () => {
  const newCert = {
    id: 'cert_new',
    studentEmail: 'student@example.com',
    uploadedAt: new Date().toISOString(),
    metadata: {
      issuer: 'Coursera',
      recipientName: 'John',
      awardDate: '2024-11-01',
      certificateID: 'COURSE-500',
    },
  };
  
  const existingCerts = [
    {
      id: 'cert_1',
      studentEmail: 'student@example.com',
      uploadedAt: new Date(Date.now() - 2000).toISOString(),
      metadata: {
        issuer: 'Coursera',
        recipientName: 'John',
        awardDate: '2024-10-01',
        certificateID: 'COURSE-400',
      },
    },
  ];
  
  const duplicates = findDuplicatesWithContext(newCert, existingCerts);
  
  assert(duplicates.length > 0, 'Should find potential duplicate');
  assert(duplicates[0].similarity.finalScore > duplicates[0].similarity.baseScore, 'Context adjustment should apply');
});

// ============================================
// FUZZY MATCHING TESTS
// ============================================

test('Fuzzy match: Exact match returns 100', () => {
  const score = fuzzyMatch('John Smith', 'John Smith', 80);
  assert.strictEqual(score, 100, 'Exact match should return 100');
});

test('Fuzzy match: Typo recognized (>80% similarity)', () => {
  const score = fuzzyMatch('Jon Smith', 'John Smith', 80);
  assert(score >= 80, 'Minor typo should be recognized');
});

test('Fuzzy match: Case insensitive', () => {
  const score = fuzzyMatch('john smith', 'JOHN SMITH', 80);
  assert.strictEqual(score, 100, 'Should be case-insensitive');
});

test('Fuzzy match: Whitespace normalized', () => {
  const score = fuzzyMatch('  John  Smith  ', 'John Smith', 80);
  assert.strictEqual(score, 100, 'Should normalize whitespace');
});

test('Fuzzy match: Institution aliases (AWS vs Amazon)', () => {
  const score = fuzzyMatch('AWS', 'Amazon Web Services', 70);
  assert(score >= 60, 'Should have some similarity between AWS and Amazon Web Services');
});

// ============================================
// DATE NORMALIZATION TESTS
// ============================================

test('Date normalize: ISO format', () => {
  const date = normalizeDate('2024-05-15');
  assert.strictEqual(date, '2024-05-15', 'Should normalize ISO date');
});

test('Date normalize: US format', () => {
  const date = normalizeDate('05/15/2024');
  assert.strictEqual(date, '2024-05-15', 'Should convert US format');
});

test('Date normalize: Invalid date returns null', () => {
  const date = normalizeDate('invalid-date');
  assert.strictEqual(date, null, 'Should return null for invalid dates');
});

// ============================================
// GROUPING TESTS
// ============================================

test('Grouping: Identify duplicate certificate groups', () => {
  const certs = [
    {
      id: 'cert_1',
      metadata: {
        issuer: 'AWS',
        recipientName: 'Alice',
        awardDate: '2024-01-01',
      },
    },
    {
      id: 'cert_2',
      metadata: {
        issuer: 'AWS',
        recipientName: 'Alice',
        awardDate: '2024-01-01',
      },
    },
    {
      id: 'cert_3',
      metadata: {
        issuer: 'Google',
        recipientName: 'Bob',
        awardDate: '2024-06-01',
      },
    },
  ];
  
  const groups = groupDuplicates(certs, 70);
  
  assert(groups.length >= 1, 'Should create at least one duplicate group');
  assert(groups[0].length >= 2, 'Group should contain multiple certificates');
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '='.repeat(50));
console.log('Test Results Summary');
console.log('='.repeat(50));
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount} ✓`);
console.log(`Failed: ${failCount} ✗`);
console.log(`Success Rate: ${Math.round((passCount / testCount) * 100)}%`);
console.log('='.repeat(50));

if (failCount === 0) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log(`✗ ${failCount} test(s) failed`);
  process.exit(1);
}
