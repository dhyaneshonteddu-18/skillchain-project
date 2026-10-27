/**
 * Test Suite: Fixed Duplicate Detection System
 * Tests: PDF extraction, similarity scoring, metadata normalization, and comparisons
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
console.log('DUPLICATE DETECTION FIXES - TEST SUITE');
console.log('='.repeat(70) + '\n');

// ============================================
// TEST GROUP 1: Metadata Extraction
// ============================================

test('Extract metadata: Recipient name with standard format', () => {
  const sampleText = 'This is to certify that John Smith has successfully completed the AWS Cloud Practitioner course on May 15, 2024. Certificate ID: AWS-2024-001';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.recipientName !== 'Not detected', 'Should extract recipient name');
  assert(metadata.recipientName.toLowerCase().includes('john'), 'Recipient name should include "john"');
});

test('Extract metadata: Recipient name with hyphenated name', () => {
  const sampleText = 'Awarded to Mary-Jane Smith for successfully completing Machine Learning course on January 10, 2024';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.recipientName !== 'Not detected', 'Should extract hyphenated recipient name');
});

test('Extract metadata: Recipient name with apostrophe', () => {
  const sampleText = 'Presented to Sean O\'Brien for completing the DevOps Engineering certification on June 2024';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.recipientName !== 'Not detected', 'Should extract name with apostrophe');
});

test('Extract metadata: Certificate ID with mixed case', () => {
  const sampleText = 'Certificate ID: cert-2024-12345, Issued by Google Cloud';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.certificateID !== 'Not detected', 'Should extract mixed-case certificate ID');
});

test('Extract metadata: Date in format "December 15th, 2024"', () => {
  const sampleText = 'Issued on: December 15th, 2024, AWS Certification';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.awardDate !== 'Not detected', 'Should extract date with ordinal suffix');
});

test('Extract metadata: Date in format "15 January 2024"', () => {
  const sampleText = 'Award Date: 15 January 2024';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.awardDate !== 'Not detected', 'Should extract date in "day month year" format');
});

test('Extract metadata: Missing issuer shows "Not detected"', () => {
  const sampleText = 'Student: John Smith, Date: 2024-05-15';
  const metadata = extractMetadata(sampleText);
  
  assert.strictEqual(metadata.issuer, 'Not detected', 'Should return "Not detected" for missing issuer');
});

test('Extract metadata: Known issuer "AWS"', () => {
  const sampleText = 'This AWS certification is awarded to John Doe';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.issuer !== 'Not detected', 'Should detect AWS as issuer');
});

// ============================================
// TEST GROUP 2: Text Normalization
// ============================================

test('Normalize text: Multiple spaces collapsed to single', () => {
  const text = 'John    Smith    received    the    award';
  const normalized = normalizeText(text);
  
  assert.strictEqual(normalized, 'john smith received the award', 'Should collapse multiple spaces');
});

test('Normalize text: Case conversion to lowercase', () => {
  const text = 'JOHN SMITH RECEIVED AWARD';
  const normalized = normalizeText(text);
  
  assert.strictEqual(normalized, 'john smith received award', 'Should convert to lowercase');
});

// ============================================
// TEST GROUP 3: Similarity Scoring - Fixed Math
// ============================================

test('Similarity: Two identical certificates = 100%', () => {
  const cert1 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'John Doe',
      awardDate: '2024-05-15',
      certificateID: 'AWS-001',
      qualification: 'Cloud Practitioner',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'John Doe',
      awardDate: '2024-05-15',
      certificateID: 'AWS-001',
      qualification: 'Cloud Practitioner',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert.strictEqual(sim.score, 100, 'Identical certificates should have 100% similarity');
});

test('Similarity: Issuer and recipient match, others missing = 100% (of available fields)', () => {
  const cert1 = {
    metadata: {
      issuer: 'Google',
      recipientName: 'Alice',
      awardDate: 'Not detected',
      certificateID: 'Not detected',
      qualification: 'Not detected',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Google',
      recipientName: 'Alice',
      awardDate: 'Not detected',
      certificateID: 'Not detected',
      qualification: 'Not detected',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert.strictEqual(sim.score, 100, 'Should score 100% for matching available fields');
});

test('Similarity: Recipient name changed = <100%', () => {
  const cert1 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'John Doe',
      awardDate: '2024-05-15',
      certificateID: 'AWS-001',
      qualification: 'Cloud Practitioner',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'Jane Doe',
      awardDate: '2024-05-15',
      certificateID: 'AWS-001',
      qualification: 'Cloud Practitioner',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert(sim.score < 100 && sim.score > 50, 'Changed name should reduce similarity');
  assert(sim.details.recipientName.score < 100, 'Recipient name field should not match exactly');
});

test('Similarity: Issue date changed = reduced score', () => {
  const cert1 = {
    metadata: {
      issuer: 'Microsoft',
      recipientName: 'Bob Smith',
      awardDate: '2024-01-15',
      certificateID: 'MSFT-999',
      qualification: 'Azure Admin',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Microsoft',
      recipientName: 'Bob Smith',
      awardDate: '2024-12-31',
      certificateID: 'MSFT-999',
      qualification: 'Azure Admin',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert(sim.score < 100, 'Different dates should reduce similarity');
  assert.strictEqual(sim.details.awardDate.score, 0, 'Date field should not match');
});

test('Similarity: Both fields changed = significantly reduced', () => {
  const cert1 = {
    metadata: {
      issuer: 'Coursera',
      recipientName: 'Alice Johnson',
      awardDate: '2024-03-01',
      certificateID: 'CRS-100',
      qualification: 'Python',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Coursera',
      recipientName: 'Alice Smith',
      awardDate: '2024-09-01',
      certificateID: 'CRS-100',
      qualification: 'Python',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert(sim.score < 80, 'Multiple changes should significantly reduce similarity');
});

test('Similarity: Completely different certificates', () => {
  const cert1 = {
    metadata: {
      issuer: 'AWS',
      recipientName: 'Alice',
      awardDate: '2024-01-01',
      certificateID: 'AWS-001',
      qualification: 'Cloud',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Google',
      recipientName: 'Bob',
      awardDate: '2024-12-31',
      certificateID: 'GOOG-999',
      qualification: 'Data Science',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert(sim.score < 50, 'Different certificates should have <50% similarity');
});

test('Similarity: Insufficient data shows "Not detected" message', () => {
  const cert1 = {
    metadata: {
      issuer: 'Not detected',
      recipientName: 'Not detected',
      awardDate: 'Not detected',
      certificateID: 'Not detected',
      qualification: 'Not detected',
    },
  };
  
  const cert2 = {
    metadata: {
      issuer: 'Not detected',
      recipientName: 'Not detected',
      awardDate: 'Not detected',
      certificateID: 'Not detected',
      qualification: 'Not detected',
    },
  };
  
  const sim = calculateDetailedSimilarity(cert1, cert2);
  assert.strictEqual(sim.score, 0, 'Should return 0 for insufficient data');
  assert.strictEqual(sim.hasEnoughData, false, 'Should flag insufficient data');
});

// ============================================
// TEST GROUP 4: Fuzzy Matching & Abbreviations
// ============================================

test('Fuzzy match: AWS vs Amazon Web Services', () => {
  const score = fuzzyMatch('AWS', 'Amazon Web Services');
  assert.strictEqual(score, 100, 'Should recognize AWS abbreviation');
});

test('Fuzzy match: GCP vs Google Cloud Platform', () => {
  const score = fuzzyMatch('GCP', 'Google Cloud Platform');
  assert.strictEqual(score, 100, 'Should recognize GCP abbreviation');
});

test('Fuzzy match: Typo in name', () => {
  const score = fuzzyMatch('John Smith', 'Jon Smith', -1);
  assert(score > 80, 'Should recognize minor typos');
});

// ============================================
// TEST GROUP 5: Date Normalization
// ============================================

test('Date normalize: MM/DD/YYYY format', () => {
  const date = normalizeDate('05/15/2024');
  assert.strictEqual(date, '2024-05-15', 'Should convert US date format');
});

test('Date normalize: YYYY-MM-DD format', () => {
  const date = normalizeDate('2024-05-15');
  assert.strictEqual(date, '2024-05-15', 'Should keep ISO format');
});

test('Date normalize: Invalid date returns null', () => {
  const date = normalizeDate('invalid');
  assert.strictEqual(date, null, 'Should return null for invalid dates');
});

// ============================================
// TEST GROUP 6: Metadata Comparison
// ============================================

test('Compare metadata: Identical metadata', () => {
  const meta1 = {
    issuer: 'AWS',
    recipientName: 'John Doe',
    awardDate: '2024-05-15',
  };
  
  const meta2 = {
    issuer: 'AWS',
    recipientName: 'John Doe',
    awardDate: '2024-05-15',
  };
  
  const comp = compareMetadata(meta1, meta2);
  assert.strictEqual(comp.similarity, 100, 'Identical metadata should be 100% match');
});

test('Compare metadata: One field different', () => {
  const meta1 = {
    issuer: 'AWS',
    recipientName: 'John Doe',
    awardDate: '2024-05-15',
  };
  
  const meta2 = {
    issuer: 'AWS',
    recipientName: 'Jane Doe',
    awardDate: '2024-05-15',
  };
  
  const comp = compareMetadata(meta1, meta2);
  assert(comp.similarity < 100 && comp.similarity > 50, 'One field different should reduce match');
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '='.repeat(70));
console.log('Test Results Summary');
console.log('='.repeat(70));
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount} ✓`);
console.log(`Failed: ${failCount} ✗`);
console.log(`Success Rate: ${Math.round((passCount / testCount) * 100)}%`);
console.log('='.repeat(70) + '\n');

if (failCount === 0) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log(`✗ ${failCount} test(s) failed`);
  process.exit(1);
}
