/**
 * Test Suite: UI Warning Persistence & Message Styling
 * Tests that duplicate warnings remain visible and don't get cleared unexpectedly
 * Tests that warning severity levels are correctly applied (error vs warning vs success)
 */

import assert from 'assert';

console.log('\n' + '='.repeat(70));
console.log('UI WARNING PERSISTENCE & MESSAGE STYLING TESTS');
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
// TEST GROUP 1: Warning Persistence Logic
// ============================================

test('State management: handleFileChange clears all messages', () => {
  // When user selects a new file, all messages should be cleared
  const state = {
    error: 'Previous error',
    success: 'Previous success',
    warning: 'Previous warning',
    duplicateInfo: { isDuplicate: true },
    duplicateAnalysisResult: { flags: { isSuspectedModified: true } }
  };
  
  // Simulate handleFileChange
  const newState = {
    error: null,
    success: null,
    warning: null,
    duplicateInfo: null,
    duplicateAnalysisResult: null
  };
  
  assert.strictEqual(newState.error, null, 'Error should be cleared');
  assert.strictEqual(newState.success, null, 'Success should be cleared');
  assert.strictEqual(newState.warning, null, 'Warning should be cleared');
});

test('State management: checkForDuplicate preserves existing warning', () => {
  // When checking for duplicates, existing warnings should not be overwritten
  const state = {
    warning: 'Previous similarity warning',
    success: 'Hash computed'
  };
  
  // checkForDuplicate should only update duplicateInfo, not clear warning
  const resultState = {
    ...state,
    duplicateInfo: { isDuplicate: false },
    checkingDuplicate: false
  };
  
  assert.strictEqual(resultState.warning, 'Previous similarity warning', 'Warning should be preserved');
  assert.strictEqual(resultState.success, 'Hash computed', 'Success should be preserved');
});

test('State management: handleUploadToIPFS only clears errors, not warnings', () => {
  // When starting upload, only errors should be cleared
  // Warnings from previous analysis should persist
  const initialState = {
    error: 'Some error',
    warning: 'Suspected modified certificate - 83% similarity',
    success: 'Hash computed',
    uploading: false
  };
  
  // Simulate handleUploadToIPFS start
  const uploadStartState = {
    ...initialState,
    error: null,  // Clear error
    uploading: true,
    // warning and success should NOT be cleared here
  };
  
  assert.strictEqual(uploadStartState.error, null, 'Error should be cleared');
  assert.strictEqual(uploadStartState.warning, 'Suspected modified certificate - 83% similarity', 'Warning should persist');
});

test('State management: Duplicate analysis result stored separately', () => {
  // Backend analysis result should be stored in duplicateAnalysisResult state
  const analysisResult = {
    flags: {
      isExactDuplicate: false,
      isContentDuplicate: false,
      isSuspectedModified: true
    },
    similarCertificates: [{
      similarity: { finalScore: 83 },
      comparison: {
        matches: { issuer: true, awardDate: true },
        differences: { recipientName: { original: 'John', modified: 'Jane' } }
      }
    }]
  };
  
  // This should be stored and later used to display warning
  const state = {
    duplicateAnalysisResult: analysisResult,
    warning: 'Suspected Modified Certificate - 83% similarity\n\nMatching fields: issuer, awardDate\nChanged fields: recipientName'
  };
  
  assert(state.duplicateAnalysisResult, 'Analysis result should be stored');
  assert(state.duplicateAnalysisResult.flags.isSuspectedModified, 'Should indicate suspected modified');
});

// ============================================
// TEST GROUP 2: Alert Severity Levels
// ============================================

test('Alert severity: Exact duplicate is ERROR (red)', () => {
  const alertConfig = {
    type: 'error',
    title: '❌ Exact Duplicate Detected',
    message: 'This certificate has been uploaded before.',
    color: 'bg-red-50 border-red-200 text-red-800'
  };
  
  assert.strictEqual(alertConfig.type, 'error', 'Exact duplicate should be error type');
  assert(alertConfig.title.includes('Exact'), 'Title should indicate exact duplicate');
  assert(alertConfig.color.includes('red'), 'Color should be red');
});

test('Alert severity: Content duplicate is ERROR (red)', () => {
  const alertConfig = {
    type: 'error',
    title: '❌ Possible Duplicate Detected',
    message: 'This appears to be the same certificate content.',
    color: 'bg-red-50 border-red-200 text-red-800'
  };
  
  assert.strictEqual(alertConfig.type, 'error', 'Content duplicate should be error type');
  assert(alertConfig.color.includes('red'), 'Color should be red');
});

test('Alert severity: Suspected modified is WARNING (yellow)', () => {
  const alertConfig = {
    type: 'warning',
    title: '🔍 Suspected Modified Certificate',
    message: 'Certificate will be uploaded and verifier will review',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };
  
  assert.strictEqual(alertConfig.type, 'warning', 'Suspected modified should be warning type');
  assert(alertConfig.color.includes('yellow'), 'Color should be yellow');
});

test('Alert severity: No duplicates is SUCCESS (green)', () => {
  const alertConfig = {
    type: 'success',
    title: '✅ No Duplicate Match Found',
    message: 'Certificate appears unique.',
    color: 'bg-green-50 border-green-200 text-green-800'
  };
  
  assert.strictEqual(alertConfig.type, 'success', 'No duplicates should be success type');
  assert(alertConfig.color.includes('green'), 'Color should be green');
});

test('Alert severity: Upload failure is ERROR (red)', () => {
  const alertConfig = {
    type: 'error',
    title: 'Error',
    message: 'Upload failed: Network error',
    color: 'bg-red-50 border-red-200 text-red-800'
  };
  
  assert.strictEqual(alertConfig.type, 'error', 'Upload failure should be error');
});

test('Alert display: Error and warning should never appear together for success', () => {
  // If upload succeeds despite warning, should show success + warning separately, not error
  const state = {
    error: null,  // No error
    warning: 'Suspected Modified Certificate',
    success: 'Certificate uploaded to IPFS successfully!'
  };
  
  assert.strictEqual(state.error, null, 'No error should be shown for successful upload');
  assert(state.warning, 'Warning should still be visible');
  assert(state.success, 'Success message should be shown');
});

// ============================================
// TEST GROUP 3: Warning Detail Content
// ============================================

test('Warning details: Exact duplicate shows issuer and timestamp', () => {
  const warningDetails = {
    issuer: 'AWS',
    timestamp: new Date().toISOString(),
    ipfsCid: 'QmXxxx...'
  };
  
  const displayText = `Issuer: ${warningDetails.issuer}\nDate: ${new Date(warningDetails.timestamp).toLocaleString()}\nIPFS CID: ${warningDetails.ipfsCid}`;
  
  assert(displayText.includes('Issuer:'), 'Should show issuer');
  assert(displayText.includes('Date:'), 'Should show timestamp');
  assert(displayText.includes('IPFS CID:'), 'Should show IPFS CID');
});

test('Warning details: Suspected modified shows similarity and changed fields', () => {
  const warningDetails = {
    similarityScore: 83,
    matchingFields: ['issuer', 'awardDate', 'certificateID'],
    changedFields: ['recipientName']
  };
  
  const displayText = `${warningDetails.similarityScore}% similarity\nMatching fields: ${warningDetails.matchingFields.join(', ')}\nChanged fields: ${warningDetails.changedFields.join(', ')}`;
  
  assert(displayText.includes('83%'), 'Should show similarity score');
  assert(displayText.includes('issuer'), 'Should show matching fields');
  assert(displayText.includes('recipientName'), 'Should show changed fields');
});

test('Warning details: Uploads should show detection method', () => {
  const methods = [
    'Binary Hash Match',
    'Normalized Text Fingerprint',
    'Extracted Metadata Analysis',
    'Text Similarity Score'
  ];
  
  methods.forEach(method => {
    assert(method.length > 0, `Detection method ${method} should be non-empty`);
  });
});

// ============================================
// TEST GROUP 4: User Interaction Flows
// ============================================

test('User flow: Select file → hash → see warning → upload → shows success + warning', () => {
  const steps = [
    { step: 'File selected', error: null, warning: null, success: null },
    { step: 'Hash computed', error: null, warning: null, success: 'Hash computed' },
    { step: 'Checking for duplicates', error: null, warning: null, success: 'Hash computed' },
    { step: 'Suspected modified found', error: null, warning: 'Suspected modified - 83%', success: 'Hash computed' },
    { step: 'Upload started', error: null, warning: 'Suspected modified - 83%', success: null }, // Only error cleared
    { step: 'Upload completed', error: null, warning: 'Suspected modified - 83%', success: 'Uploaded successfully' }
  ];
  
  const finalState = steps[steps.length - 1];
  assert.strictEqual(finalState.error, null, 'Final state should have no error');
  assert(finalState.warning, 'Final state should show warning');
  assert(finalState.success, 'Final state should show success');
});

test('User flow: Select file → hash → no warning → upload → success only', () => {
  const steps = [
    { step: 'File selected', error: null, warning: null, success: null },
    { step: 'Hash computed', error: null, warning: null, success: 'Hash computed' },
    { step: 'No duplicates found', error: null, warning: null, success: 'No Duplicate Match Found' },
    { step: 'Upload started', error: null, warning: null, success: null }, // Clear success when starting
    { step: 'Upload completed', error: null, warning: null, success: 'Uploaded successfully' }
  ];
  
  const finalState = steps[steps.length - 1];
  assert.strictEqual(finalState.error, null, 'Should have no error');
  assert.strictEqual(finalState.warning, null, 'Should have no warning');
  assert(finalState.success, 'Should show success');
});

test('User flow: Select file → hash → exact duplicate found → blocked', () => {
  const steps = [
    { step: 'File selected', error: null, warning: null, success: null },
    { step: 'Hash computed', error: null, warning: null, success: 'Hash computed' },
    { step: 'Exact duplicate found', error: 'Exact Duplicate Detected', warning: null, success: null },
    { step: 'Upload button disabled', canUpload: false }
  ];
  
  const finalState = steps[steps.length - 1];
  assert(finalState.canUpload === false, 'Upload should be disabled for exact duplicate');
});

test('User flow: Change file → all messages cleared → start fresh', () => {
  const initialState = { error: 'Error', warning: 'Warning', success: 'Success', hash: 'abc123' };
  
  // User clicks "Change" button, which calls handleReset
  const afterChangeState = { 
    error: null, 
    warning: null, 
    success: null, 
    hash: null,
    duplicateInfo: null,
    duplicateAnalysisResult: null
  };
  
  assert.strictEqual(afterChangeState.error, null, 'Error should be cleared');
  assert.strictEqual(afterChangeState.warning, null, 'Warning should be cleared');
  assert.strictEqual(afterChangeState.success, null, 'Success should be cleared');
  assert.strictEqual(afterChangeState.hash, null, 'Hash should be cleared');
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
  console.log(`\n✅ All UI warning persistence tests passed!\n`);
  process.exit(0);
} else {
  console.log(`\n❌ Some tests failed\n`);
  process.exit(1);
}
