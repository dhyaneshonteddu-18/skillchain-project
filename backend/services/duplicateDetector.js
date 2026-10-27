/**
 * Advanced Duplicate Detection Service
 * Implements weighted similarity scoring with fuzzy matching
 * Handles detection at scale (1000+ records)
 */

import { createHash } from 'crypto';

/**
 * Levenshtein distance for fuzzy string matching
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Distance (lower = more similar)
 */
export const levenshteinDistance = (str1, str2) => {
  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();
  
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(0));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let i = 0; i <= s2.length; i++) matrix[i][0] = i;

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      const cost = s1[j - 1] === s2[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s2.length][s1.length];
};

/**
 * Calculate fuzzy string similarity (0-100)
 * Handles abbreviations, synonyms, and common variations
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} threshold - Optional minimum similarity threshold (default: return raw score)
 * @returns {number} - Similarity score 0-100 (or 0 if below threshold when threshold is specified)
 */
export const fuzzyMatch = (str1, str2, threshold = -1) => {
  if (!str1 || !str2) return 0;
  
  const s1 = String(str1)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');  // Normalize multiple whitespaces
  const s2 = String(str2)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');  // Normalize multiple whitespaces
  
  if (s1 === s2) return 100;
  
  // Check for known abbreviations and aliases
  const abbreviations = {
    'aws': 'amazon web services',
    'gcp': 'google cloud platform',
    'msft': 'microsoft',
    'ibm': 'international business machines',
    'goog': 'google',
  };
  
  const normalized_s1 = abbreviations[s1] || s1;
  const normalized_s2 = abbreviations[s2] || s2;
  
  // If one is an abbreviation of the other, check expanded form
  if (normalized_s1 !== s1 || normalized_s2 !== s2) {
    if (normalized_s1 === normalized_s2) return 100;
    // Check if expanded abbreviation appears in the other string
    if (normalized_s1 !== s1 && normalized_s2.includes(normalized_s1)) return 85;
    if (normalized_s2 !== s2 && normalized_s1.includes(normalized_s2)) return 85;
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  const similarity = Math.round(((maxLen - distance) / maxLen) * 100);
  
  // Only apply threshold filtering if explicitly set to >= 0
  if (threshold >= 0) {
    return similarity >= threshold ? similarity : 0;
  }
  
  return similarity;
};

/**
 * Normalize date to YYYY-MM-DD format
 * @param {string} dateStr - Date string in various formats
 * @returns {string|null} - Normalized date or null
 */
export const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  
  let date;
  const str = String(dateStr).trim();
  
  // Try MM/DD/YYYY format (US) first - highest priority due to ambiguity
  const usFormatMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usFormatMatch) {
    const [_, month, day, year] = usFormatMatch;
    date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  // Try DD-MM-YYYY or YYYY-MM-DD formats (ISO-like)
  const isoFormatMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoFormatMatch) {
    const [_, year, month, day] = isoFormatMatch;
    date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  // Try generic Date parsing as fallback
  date = new Date(str);
  if (!isNaN(date.getTime())) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  return null;
};

/**
 * Calculate weighted similarity between two certificates
 * @param {Object} cert1 - First certificate with metadata
 * @param {Object} cert2 - Second certificate with metadata
 * @returns {Object} - Detailed similarity analysis
 */
export const calculateDetailedSimilarity = (cert1, cert2) => {
  if (!cert1 || !cert2) {
    return {
      score: 0,
      explanation: 'Insufficient evidence - certificates missing',
      details: {},
      fieldsEvaluated: 0,
      hasEnoughData: false,
    };
  }
  
  const meta1 = cert1.metadata || {};
  const meta2 = cert2.metadata || {};
  
  // Check if we have actual data to compare (not just "Not detected" values)
  const hasData1 = Object.values(meta1).some(v => v && v !== 'Not detected');
  const hasData2 = Object.values(meta2).some(v => v && v !== 'Not detected');
  
  if (!hasData1 || !hasData2) {
    return {
      score: 0,
      explanation: 'Insufficient evidence - metadata cannot be extracted reliably',
      details: { meta1, meta2 },
      fieldsEvaluated: 0,
      hasEnoughData: false,
    };
  }
  
  // Field weights (must sum to 100)
  const weights = {
    issuer: 0.35,
    recipientName: 0.30,
    awardDate: 0.20,
    certificateID: 0.10,
    qualification: 0.05,
  };
  
  const details = {};
  let weightedScore = 0;
  let fieldsEvaluated = 0;

  // Issuer comparison (35% weight)
  const issuer1 = meta1.issuer && meta1.issuer !== 'Not detected' ? meta1.issuer : null;
  const issuer2 = meta2.issuer && meta2.issuer !== 'Not detected' ? meta2.issuer : null;
  
  if (issuer1 || issuer2) {
    const match = issuer1 && issuer2 ? fuzzyMatch(issuer1, issuer2) : 0;
    details.issuer = {
      score: match,
      val1: issuer1,
      val2: issuer2,
      method: match === 100 ? 'exact' : match > 0 ? 'fuzzy' : 'none',
    };
    weightedScore += (match / 100) * weights.issuer;
    fieldsEvaluated += weights.issuer;
  }

  // Recipient name comparison (30% weight)
  const recipient1 = meta1.recipientName && meta1.recipientName !== 'Not detected' ? meta1.recipientName : null;
  const recipient2 = meta2.recipientName && meta2.recipientName !== 'Not detected' ? meta2.recipientName : null;
  
  if (recipient1 || recipient2) {
    const match = recipient1 && recipient2 ? fuzzyMatch(recipient1, recipient2) : 0;
    details.recipientName = {
      score: match,
      val1: recipient1,
      val2: recipient2,
      method: match === 100 ? 'exact' : match > 0 ? 'fuzzy' : 'none',
    };
    weightedScore += (match / 100) * weights.recipientName;
    fieldsEvaluated += weights.recipientName;
  }

  // Award date comparison (20% weight)
  const date1 = meta1.awardDate && meta1.awardDate !== 'Not detected' ? meta1.awardDate : null;
  const date2 = meta2.awardDate && meta2.awardDate !== 'Not detected' ? meta2.awardDate : null;
  
  if (date1 || date2) {
    const normalized1 = date1 ? normalizeDate(date1) : null;
    const normalized2 = date2 ? normalizeDate(date2) : null;
    const match = (normalized1 && normalized2 && normalized1 === normalized2) ? 100 : 0;
    details.awardDate = {
      score: match,
      val1: normalized1,
      val2: normalized2,
      method: match === 100 ? 'exact' : 'none',
    };
    weightedScore += (match / 100) * weights.awardDate;
    fieldsEvaluated += weights.awardDate;
  }

  // Certificate ID comparison (10% weight)
  const id1 = meta1.certificateID && meta1.certificateID !== 'Not detected' ? meta1.certificateID : null;
  const id2 = meta2.certificateID && meta2.certificateID !== 'Not detected' ? meta2.certificateID : null;
  
  if (id1 || id2) {
    const match = id1 && id2 ? fuzzyMatch(id1, id2) : 0;
    details.certificateID = {
      score: match,
      val1: id1,
      val2: id2,
      method: match === 100 ? 'exact' : match > 0 ? 'fuzzy' : 'none',
    };
    weightedScore += (match / 100) * weights.certificateID;
    fieldsEvaluated += weights.certificateID;
  }

  // Qualification comparison (5% weight)
  const qual1 = meta1.qualification && meta1.qualification !== 'Not detected' ? meta1.qualification : null;
  const qual2 = meta2.qualification && meta2.qualification !== 'Not detected' ? meta2.qualification : null;
  
  if (qual1 || qual2) {
    const match = qual1 && qual2 ? fuzzyMatch(qual1, qual2) : 0;
    details.qualification = {
      score: match,
      val1: qual1,
      val2: qual2,
      method: match === 100 ? 'exact' : match > 0 ? 'fuzzy' : 'none',
    };
    weightedScore += (match / 100) * weights.qualification;
    fieldsEvaluated += weights.qualification;
  }

  // Normalize score to 0-100
  const finalScore = fieldsEvaluated > 0 ? Math.round((weightedScore / fieldsEvaluated) * 100) : 0;

  return {
    score: finalScore,
    explanation: getSimilarityExplanation(finalScore),
    details,
    fieldsEvaluated,
    hasEnoughData: fieldsEvaluated > 0,
  };
};

/**
 * Get human-readable explanation of similarity score
 * SIMPLIFIED: Only shows "100% matched" for any duplicate detected
 * @param {number} score - Similarity score 0-100
 * @returns {string} - Explanation
 */
export const getSimilarityExplanation = (score) => {
  if (score >= 50) {
    return '100% matched to some previous certificate';
  }
  return 'Unique - Certificate appears different from others in system';
};

/**
 * Classify similarity result
 * SIMPLIFIED: Only two outcomes - duplicate or unique
 * @param {number} score - Similarity score
 * @returns {string} - Classification
 */
export const classifySimilarity = (score) => {
  if (score >= 50) return 'duplicate';
  return 'unique';
};

/**
 * Find duplicates with context scoring
 * @param {Object} newCert - New certificate to check
 * @param {Array<Object>} existingCerts - Existing certificates
 * @returns {Array<Object>} - Sorted results with similarity scores
 */
export const findDuplicatesWithContext = (newCert, existingCerts) => {
  if (!newCert || !existingCerts || existingCerts.length === 0) {
    return [];
  }

  const results = [];
  const now = new Date();

  existingCerts.forEach(existingCert => {
    // Skip if same certificate
    if (newCert.id === existingCert.id) return;

    // Calculate base similarity
    const similarity = calculateDetailedSimilarity(newCert, existingCert);
    let score = similarity.score;

    // Context adjustments (±5-15%)
    const studentMatch = newCert.studentEmail === existingCert.studentEmail;
    const uploadTime = newCert.uploadedAt ? new Date(newCert.uploadedAt) : now;
    const existingTime = existingCert.uploadedAt ? new Date(existingCert.uploadedAt) : new Date(0);
    const timeDiffHours = (uploadTime - existingTime) / (1000 * 60 * 60);

    // Context scoring
    let contextAdjustment = 0;
    if (studentMatch) {
      // Same student uploading similar cert - suspicious if within 1 hour
      if (timeDiffHours < 1 && timeDiffHours > 0) {
        contextAdjustment += 10;
      }
    } else {
      // Different students - higher fraud indicator
      if (similarity.details.issuer?.score >= 90) {
        contextAdjustment += 15;
      }
    }

    const finalScore = Math.min(100, score + contextAdjustment);

    results.push({
      certificateId: existingCert.id,
      fileName: existingCert.fileName,
      studentEmail: existingCert.studentEmail,
      uploadedAt: existingCert.uploadedAt,
      status: existingCert.status,
      similarity: {
        baseScore: score,
        finalScore,
        contextAdjustment,
        classification: classifySimilarity(finalScore),
        explanation: getSimilarityExplanation(finalScore),
        details: similarity.details,
      },
    });
  });

  // Sort by similarity score (highest first)
  return results.sort((a, b) => b.similarity.finalScore - a.similarity.finalScore);
};

/**
 * Group certificates by duplicate relationships
 * @param {Array<Object>} certificates - All certificates
 * @param {number} threshold - Minimum similarity to group (default 70)
 * @returns {Array<Array<Object>>} - Groups of related certificates
 */
export const groupDuplicates = (certificates, threshold = 70) => {
  if (!certificates || certificates.length === 0) return [];

  const groups = [];
  const processed = new Set();

  certificates.forEach((cert, idx) => {
    if (processed.has(cert.id)) return;

    const group = [cert];
    processed.add(cert.id);

    // Find all certificates similar to this one
    for (let i = idx + 1; i < certificates.length; i++) {
      const other = certificates[i];
      if (processed.has(other.id)) continue;

      const similarity = calculateDetailedSimilarity(cert, other);
      if (similarity.score >= threshold) {
        group.push(other);
        processed.add(other.id);
      }
    }

    // Only add groups with actual duplicates (size > 1)
    if (group.length > 1) {
      groups.push(group);
    }
  });

  return groups;
};

export default {
  calculateDetailedSimilarity,
  findDuplicatesWithContext,
  groupDuplicates,
  fuzzyMatch,
  normalizeDate,
  levenshteinDistance,
};
