/**
 * Test Suite: SkillChain Demo Studio Issuer Extraction
 * Tests the specific issuer pattern extraction for "SkillChain Demo Studio"
 */

import assert from 'assert';
import { extractMetadata } from '../backend/services/pdfAnalysis.js';

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
console.log('SKILLCHAIN DEMO STUDIO - ISSUER EXTRACTION TESTS');
console.log('='.repeat(70) + '\n');

// ============================================
// TEST GROUP 1: SkillChain Demo Studio Patterns
// ============================================

test('Extract issuer: "SkillChain Demo Studio" basic pattern', () => {
  const sampleText = 'Certificate of Completion\nIssued by: SkillChain Demo Studio\nAwarded to: John Smith';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.issuer !== 'Not detected', 'Should detect SkillChain Demo Studio');
  assert(metadata.issuer.toLowerCase().includes('skillchain'), 'Should include "skillchain"');
});

test('Extract issuer: "SkillChain Demo Studio" without "by"', () => {
  const sampleText = 'Certificate of Completion\nSkillChain Demo Studio\nAwarded to: Jane Doe\nDate: October 24, 2026';
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.issuer !== 'Not detected', 'Should detect SkillChain Demo Studio without "issued by"');
});

test('Extract issuer: SkillChain with course context', () => {
  const sampleText = `
    Certificate of Achievement
    This is to certify that Sarah Johnson has successfully completed
    Applied Data Visualization Sprint
    Issue Date: 24 October 2026
    Demo ID: SC-EDIT-2026-017
    Issued by SkillChain Demo Studio
  `;
  const metadata = extractMetadata(sampleText);
  
  assert(metadata.issuer !== 'Not detected', 'Should detect issuer in complex context');
  assert(metadata.awardDate !== 'Not detected', 'Should also extract date: 24 October 2026');
});

test('Extract metadata: Demo certificate with all fields', () => {
  const demoText = `
    Certificate of Completion
    Applied Data Visualization Sprint
    
    This is to certify that John Anderson has successfully completed the course requirements
    for the Applied Data Visualization Sprint certification program.
    
    Issue Date: 24 October 2026
    Certificate ID: SC-EDIT-2026-017
    
    Issued by SkillChain Demo Studio
    
    This certificate represents demonstrated competency in the subject matter.
  `;
  const metadata = extractMetadata(demoText);
  
  assert.strictEqual(metadata.issuer !== 'Not detected', true, 'Issuer should be detected');
  assert.strictEqual(metadata.recipientName !== 'Not detected', true, 'Recipient should be detected');
  assert.strictEqual(metadata.awardDate !== 'Not detected', true, 'Award date should be detected');
  assert.strictEqual(metadata.certificateID !== 'Not detected', true, 'Certificate ID should be detected');
});

test('Extract metadata: Modified demo certificate (changed recipient)', () => {
  const modifiedText = `
    Certificate of Completion
    Applied Data Visualization Sprint
    
    This is to certify that Jane Wilson has successfully completed the course requirements
    for the Applied Data Visualization Sprint certification program.
    
    Issue Date: 24 October 2026
    Certificate ID: SC-EDIT-2026-017
    
    Issued by SkillChain Demo Studio
  `;
  const metadata = extractMetadata(modifiedText);
  
  assert.strictEqual(metadata.issuer !== 'Not detected', true, 'Issuer should be detected');
  assert.strictEqual(metadata.recipientName !== 'Not detected', true, 'Recipient should be detected');
  assert(metadata.recipientName.toLowerCase().includes('jane'), 'Modified recipient name should be Jane');
});

test('Extract issuer: Case variations of SkillChain', () => {
  const testCases = [
    'Issued by SkillChain Demo Studio',
    'Issued by skillchain demo studio',
    'Issued by SKILLCHAIN DEMO STUDIO',
    'SkillChain Demo Studio Certificate',
  ];

  testCases.forEach((text, idx) => {
    const metadata = extractMetadata(text);
    assert(metadata.issuer !== 'Not detected', `Test case ${idx + 1} should detect issuer from: "${text}"`);
  });
});

test('Extract issuer: SkillChain without "Demo" word', () => {
  const text = 'Certificate issued by SkillChain Studio';
  const metadata = extractMetadata(text);
  
  assert(metadata.issuer !== 'Not detected', 'Should detect SkillChain even without Demo word');
});

test('Extract issuer: Multiple issuer patterns - priority correct', () => {
  // This tests that generic "issued by" pattern is tried first
  const text = 'Issued by SkillChain Demo Studio in partnership with AWS';
  const metadata = extractMetadata(text);
  
  // Should catch the first issuer in "issued by" pattern
  assert(metadata.issuer !== 'Not detected', 'Should detect issuer');
});

test('Metadata confidence with SkillChain Demo certificate', () => {
  const fullCertText = `
    Certificate of Completion
    Applied Data Visualization Sprint
    
    Awarded to: Robert Taylor
    Issue Date: 24 October 2026
    Certificate ID: SC-EDIT-2026-017
    
    Issued by SkillChain Demo Studio
    Course Name: Data Visualization Fundamentals
  `;
  const metadata = extractMetadata(fullCertText);
  
  // Count how many key fields were extracted
  const fields = ['issuer', 'certificateName', 'recipientName', 'awardDate', 'certificateID'];
  const detectedCount = fields.filter(f => metadata[f] && metadata[f] !== 'Not detected').length;
  
  console.log(`    SkillChain Demo metadata extraction: ${detectedCount}/${fields.length} fields detected`);
  assert(detectedCount >= 3, 'Should detect at least 3 key fields');
});

test('Demo certificate ID extraction: SC-EDIT-2026-017', () => {
  const text = 'Demo ID: SC-EDIT-2026-017';
  const metadata = extractMetadata(text);
  
  assert(metadata.certificateID !== 'Not detected', 'Should extract demo-style certificate ID');
});

// ============================================
// TEST GROUP 2: Comparison with other issuers
// ============================================

test('SkillChain should not be confused with AWS', () => {
  const skillchainText = 'Issued by SkillChain Demo Studio';
  const awsText = 'Issued by AWS';
  
  const skillchainMeta = extractMetadata(skillchainText);
  const awsMeta = extractMetadata(awsText);
  
  assert(skillchainMeta.issuer !== awsMeta.issuer, 'Different issuers should be distinguished');
});

test('Extract issuer: Multiple organizations - SkillChain takes precedence', () => {
  const text = `
    Certificate Program
    Issued by SkillChain Demo Studio
    In partnership with Google Cloud Platform
    Award Date: 24 October 2026
  `;
  const metadata = extractMetadata(text);
  
  assert(metadata.issuer.toLowerCase().includes('skillchain'), 'SkillChain should be primary issuer');
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
  console.log(`✓ All tests passed!\n`);
  process.exit(0);
} else {
  console.log(`✗ Some tests failed\n`);
  process.exit(1);
}
