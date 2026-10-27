/**
 * Certificate Analysis Utility
 * Client-side helper functions for metadata extraction and duplicate checking
 */

/**
 * Extract certificate metadata from file
 * @param {File} file - PDF or image file
 * @returns {Promise<Object>} - Extracted metadata
 */
export const extractCertificateMetadata = async (file) => {
  try {
    // For now, return placeholder metadata
    // In production, this would parse PDF content or call backend analysis
    return {
      issuer: null,
      recipientName: null,
      certificateId: null,
      awardDate: null,
      qualification: null,
      course: null,
    };
  } catch (error) {
    console.warn('Could not extract metadata:', error);
    return null;
  }
};

/**
 * Find duplicate certificates from local storage
 * @param {Object} metadata - Certificate metadata
 * @returns {Array<Object>} - Potential duplicates
 */
export const findDuplicateCertificates = (metadata) => {
  // This function would check against locally stored certificates
  // or call backend API for comparison
  // For now, return empty array (actual checking done on backend)
  return [];
};

/**
 * Calculate similarity score between two metadata objects
 * @param {Object} metadata1 - First metadata
 * @param {Object} metadata2 - Second metadata
 * @returns {Number} - Similarity score 0-100
 */
export const calculateMetadataSimilarity = (metadata1, metadata2) => {
  if (!metadata1 || !metadata2) return 0;

  const fields = ['issuer', 'recipientName', 'certificateId', 'awardDate', 'qualification'];
  let matches = 0;
  let totalFields = 0;

  fields.forEach(field => {
    const val1 = metadata1[field];
    const val2 = metadata2[field];

    if (val1 || val2) {
      totalFields++;
      if (val1 && val2) {
        const normalized1 = String(val1).toLowerCase().trim();
        const normalized2 = String(val2).toLowerCase().trim();
        if (normalized1 === normalized2) {
          matches++;
        }
      }
    }
  });

  return totalFields > 0 ? Math.round((matches / totalFields) * 100) : 0;
};

export default {
  extractCertificateMetadata,
  findDuplicateCertificates,
  calculateMetadataSimilarity,
};
