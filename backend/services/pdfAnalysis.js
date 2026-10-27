import { createHash } from 'crypto';

/**
 * PDF Analysis Service for Certificate Duplicate Detection
 * Provides:
 * 1. Binary hash (Keccak-256) for exact duplicate detection
 * 2. Text extraction and normalization for content fingerprinting
 * 3. Metadata extraction for structured comparison
 * 4. Similarity scoring for modified copies
 */

/**
 * Extract text from PDF buffer
 * Uses pdf-parse for reliable PDF text extraction
 * Falls back to basic extraction if pdf-parse unavailable
 */
export const extractTextFromPDF = async (buffer) => {
  try {
    // Try to use pdf-parse if available (npm install pdf-parse)
    try {
      const pdfParse = await import('pdf-parse').catch(() => null);
      if (pdfParse && pdfParse.default) {
        const pdfData = await pdfParse.default(buffer);
        if (pdfData && pdfData.text) {
          return pdfData.text;
        }
      }
    } catch (parseErr) {
      console.warn('pdf-parse not available, using fallback extraction');
    }

    // Fallback: Extract text patterns from PDF binary
    // This works for simple PDFs with embedded text
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 500000));
    
    // Extract text between common PDF markers
    const extracted = [];
    const textObjects = text.match(/BT[\s\S]*?ET/g) || [];
    
    textObjects.forEach(obj => {
      const matches = obj.match(/\((.*?)\)/g);
      if (matches) {
        matches.forEach(match => {
          const content = match.slice(1, -1);
          if (content && content.length > 0) {
            extracted.push(content);
          }
        });
      }
    });

    if (extracted.length > 0) {
      return extracted.join(' ');
    }

    // Last resort: return all printable text
    return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  } catch (err) {
    console.warn('PDF text extraction failed:', err.message);
    return null;
  }
};

/**
 * Normalize text for fingerprinting
 * - Remove whitespace inconsistencies
 * - Normalize line breaks
 * - Convert to lowercase for comparison
 * - Remove formatting artifacts
 */
export const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    // Remove multiple spaces, tabs, etc.
    .replace(/\s+/g, ' ')
    // Remove line breaks but keep structural meaning
    .replace(/[\r\n]+/g, '\n')
    // Normalize common formatting
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    // Convert to lowercase for comparison
    .toLowerCase()
    // Trim
    .trim();
};

/**
 * Create a stable fingerprint from normalized text
 * Uses SHA-256 of normalized content (not binary hash)
 */
export const createTextFingerprint = (text) => {
  if (!text) return null;
  
  const normalized = normalizeText(text);
  const hash = createHash('sha256').update(normalized).digest('hex');
  return `0x${hash}`;
};

/**
 * Extract key metadata from certificate text
 * Returns object with all fields, using "Not detected" for missing values
 */
export const extractMetadata = (text) => {
  if (!text) {
    return {
      issuer: 'Not detected',
      certificateName: 'Not detected',
      recipientName: 'Not detected',
      awardDate: 'Not detected',
      certificateID: 'Not detected',
      qualification: 'Not detected',
    };
  }
  
  const normalized = text.toLowerCase();
  
  return {
    issuer: extractIssuer(normalized) || 'Not detected',
    certificateName: extractCertificateName(normalized) || 'Not detected',
    recipientName: extractRecipientName(normalized) || 'Not detected',
    awardDate: extractAwardDate(normalized) || 'Not detected',
    certificateID: extractCertificateID(normalized) || 'Not detected',
    qualification: extractQualification(normalized) || 'Not detected',
  };
};

const extractIssuer = (text) => {
  // First, try to find issuer from known patterns
  const patterns = [
    /(?:issued?\s+by|organization|from|awarded?\s+by|provided?\s+by)\s*:?\s*([^\n,\.]+)/i,
    /issuer\s*:?\s*([^\n,\.]+)/i,
    /skillchain\s+(?:demo\s+)?studio/i,  // Specific pattern for "SkillChain Demo Studio"
    /((?:SkillChain|AWS|Google|Microsoft|Coursera|Udemy|edX|LinkedIn|Infosys|IBM|Apple|Adobe|Salesforce)[\w\s&]*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let issuer = (match[1] || match[0] || '').trim();
      if (issuer && issuer.length > 2 && !['the', 'this', 'certificate', 'is', 'and'].includes(issuer.toLowerCase())) {
        return issuer;
      }
    }
  }
  return null;
};

const extractCertificateName = (text) => {
  const patterns = [
    /(?:certificate|certification)\s+(?:of|in|name|title)\s*:?\s*([^\n,]+)/i,
    /course\s+name?\s*:?\s*([^\n,]+)/i,
    /(?:certification|diploma|course)\s*:?\s*([^\n,]+)/i,
    /title\s*:?\s*([^\n,]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let name = (match[1] || '').trim();
      if (name && name.length > 2) {
        return name;
      }
    }
  }
  return null;
};

const extractRecipientName = (text) => {
  // More flexible patterns that handle various formatting
  const patterns = [
    /this\s+is\s+to\s+certify\s+that\s+([A-Za-z\s\-\']+?)\s+(?:has|have)\s+successfully/i,
    /(?:awarded?|issued?|presented?|this\s+is\s+to\s+certify\s+that)\s+to\s*:?\s*([^\n,\.]+?)(?:\s+(?:for|on|has|this|has successfully|completed))/i,
    /(?:awarded?|issued?|presented?)\s+to\s*:?\s*([A-Za-z\s\-\']+?)(?:\n|,|for|$)/i,
    /recipient\s*:?\s*([A-Za-z\s\-\']+?)(?:\n|,|$)/i,
    /student\s+name\s*:?\s*([A-Za-z\s\-\']+?)(?:\n|,|$)/i,
    /name\s*:?\s*([A-Za-z\s\-\']+?)(?:\n|,|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let name = (match[1] || '').trim();
      if (name && name.length > 1 && !['the', 'this', 'certificate', 'is', 'hereby', 'awarded'].includes(name.toLowerCase())) {
        return name;
      }
    }
  }
  return null;
};

const extractAwardDate = (text) => {
  const patterns = [
    /(?:issued?\s+on|date|awarded|completion\s+date)\s*:?\s*([^\n,]+?)(?:\n|$)/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,  // MM/DD/YYYY or MM-DD-YYYY
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,  // YYYY-MM-DD
    /([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/i,  // January 15th, 2024
    /(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,   // 15 January 2024
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let date = (match[1] || '').trim();
      if (date) {
        // Clean up "th", "st", "nd", "rd" from dates
        date = date.replace(/(\d{1,2})(st|nd|rd|th)/i, '$1');
        return date;
      }
    }
  }
  return null;
};

const extractCertificateID = (text) => {
  const patterns = [
    /(?:certificate\s+)?(?:id|number|ref|reference)\s*:?\s*([A-Z0-9\-_]+)/i,
    /(?:cert|id)\s*#\s*([A-Z0-9\-_]+)/i,
    /([A-Z]{2,}\d{3,})/,  // At least 2 letters followed by 3+ digits
    /([A-Z0-9]{6,})/,     // At least 6 alphanumeric characters
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let id = (match[1] || '').trim();
      if (id && id.length > 2 && !['THIS', 'CERT', 'CERTIFICATE'].includes(id)) {
        return id;
      }
    }
  }
  return null;
};

const extractQualification = (text) => {
  const patterns = [
    /(?:skill|qualification|achievement|specialization|track)\s*:?\s*([^\n,]+)/i,
    /(python|javascript|typescript|java|c\+\+|c#|ruby|php|go|rust|kotlin|swift|flutter|react|angular|vue|node|express|django|flask|spring|aws|azure|gcp|kubernetes|docker|devops|machine learning|data science|artificial intelligence|web development|mobile development|fullstack|backend|frontend|ui\/ux|cybersecurity)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let qualification = (match[1] || '').trim();
      if (qualification && qualification.length > 2) {
        return qualification;
      }
    }
  }
  return null;
};

/**
 * Compare two text fingerprints
 * Returns similarity score (0-100)
 */
export const compareFingerprints = (fingerprint1, fingerprint2) => {
  if (!fingerprint1 || !fingerprint2) return 0;
  if (fingerprint1 === fingerprint2) return 100;
  
  // If fingerprints differ, they're different documents
  return 0;
};

/**
 * Compare metadata between two certificates
 * Returns detailed comparison with field-by-field match
 */
export const compareMetadata = (metadata1, metadata2) => {
  if (!metadata1 || !metadata2) return { similarity: 0, matches: {}, differences: {} };
  
  const matches = {};
  const differences = {};
  let matchCount = 0;
  let totalFields = 0;
  
  const fields = ['issuer', 'certificateName', 'recipientName', 'awardDate', 'certificateID', 'qualification'];
  
  fields.forEach(field => {
    const val1 = metadata1[field];
    const val2 = metadata2[field];
    
    // Skip fields that are "Not detected" in both
    const isNotDetected1 = val1 === 'Not detected' || !val1;
    const isNotDetected2 = val2 === 'Not detected' || !val2;
    
    if (isNotDetected1 && isNotDetected2) {
      // Both missing - not counted in comparison
      return;
    }
    
    totalFields++;
    
    if (!isNotDetected1 && !isNotDetected2) {
      const normalized1 = String(val1).toLowerCase().trim();
      const normalized2 = String(val2).toLowerCase().trim();
      
      if (normalized1 === normalized2) {
        matches[field] = val1;
        matchCount++;
      } else {
        differences[field] = { original: val1, modified: val2 };
      }
    } else if (isNotDetected1 !== isNotDetected2) {
      // One missing, one present - counts as difference
      differences[field] = { original: val1 || 'Not detected', modified: val2 || 'Not detected' };
    }
  });
  
  const similarity = totalFields > 0 ? Math.round((matchCount / totalFields) * 100) : 0;
  
  return {
    similarity,
    matches,
    differences,
    isSuspected: similarity >= 70, // Likely duplicate if 70% match
    isDuplicate: similarity >= 90,  // Definite duplicate if 90% match
  };
};

/**
 * Analyze a certificate for duplication
 * Returns comprehensive analysis report
 */
export const analyzeCertificate = async (buffer, fileName) => {
  try {
    // 1. Binary hash (Keccak-256)
    const binaryHash = createHash('sha256').update(buffer).digest('hex');
    const binaryHashHex = `0x${binaryHash}`;
    
    // 2. Extract text
    const extractedText = await extractTextFromPDF(buffer);
    
    // 3. Create fingerprint
    const textFingerprint = createTextFingerprint(extractedText);
    
    // 4. Extract metadata
    const metadata = extractMetadata(extractedText);
    
    return {
      fileName,
      fileSize: buffer.length,
      binaryHash: binaryHashHex,
      textFingerprint,
      extractedText: extractedText ? extractedText.substring(0, 5000) : null, // First 5000 chars
      metadata,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Certificate analysis error:', err);
    throw err;
  }
};

/**
 * Calculate similarity between two analysis reports
 * Uses advanced weighted scoring from duplicateDetector
 */
export const calculateSimilarity = async (analysis1, analysis2) => {
  // Import the advanced detector
  const { calculateDetailedSimilarity } = await import('./duplicateDetector.js').catch(() => ({}));
  
  if (!calculateDetailedSimilarity) {
    // Fallback to basic calculation if duplicateDetector unavailable
    const results = {
      binaryHashMatch: analysis1.binaryHash === analysis2.binaryHash,
      fingerprintMatch: analysis1.textFingerprint === analysis2.textFingerprint,
      metadataComparison: compareMetadata(analysis1.metadata, analysis2.metadata),
    };
    
    return {
      ...results,
      overallSimilarity: results.metadataComparison.similarity,
      isExactDuplicate: results.binaryHashMatch,
      isContentDuplicate: results.fingerprintMatch,
      isSuspectedModified: 
        !results.binaryHashMatch && 
        results.metadataComparison.similarity >= 70,
    };
  }

  // Use advanced similarity calculation
  const detailedSimilarity = calculateDetailedSimilarity(analysis1, analysis2);
  
  return {
    binaryHashMatch: analysis1.binaryHash === analysis2.binaryHash,
    fingerprintMatch: analysis1.textFingerprint === analysis2.textFingerprint,
    detailedSimilarity,
    overallSimilarity: detailedSimilarity.score,
    isExactDuplicate: analysis1.binaryHash === analysis2.binaryHash,
    isContentDuplicate: analysis1.textFingerprint === analysis2.textFingerprint,
    isSuspectedModified: 
      !analysis1.binaryHash === analysis2.binaryHash && 
      detailedSimilarity.score >= 70,
    classification: detailedSimilarity.explanation,
  };
};
