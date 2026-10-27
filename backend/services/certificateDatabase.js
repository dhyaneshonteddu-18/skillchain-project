/**
 * Certificate Database Service
 * Persists certificate analysis to a simple JSON-based store
 * In production, replace with a real database (PostgreSQL, MongoDB, etc.)
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = './data';
const CERTIFICATES_FILE = path.join(DATA_DIR, 'certificates.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
};

// Load all certificates from storage
export const loadCertificates = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CERTIFICATES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to load certificates:', err);
    return [];
  }
};

// Save certificates to storage
export const saveCertificates = async (certificates) => {
  try {
    await ensureDataDir();
    await fs.writeFile(
      CERTIFICATES_FILE,
      JSON.stringify(certificates, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('Failed to save certificates:', err);
    throw err;
  }
};

// Internal helper for loading
const _loadCertificates = loadCertificates;

/**
 * Store a certificate analysis with wallet address
 */
export const storeCertificate = async (analysis, studentEmail, ipfsCid, status = 'pending', studentWallet = null) => {
  const certificates = await loadCertificates();
  
  // Determine achievement type from metadata
  const achievementType = extractAchievementType(analysis.metadata);
  
  const record = {
    id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    studentEmail,
    studentWallet, // NEW: Store the wallet address linked to this certificate
    achievementType, // NEW: Store the achievement type detected from certificate
    fileName: analysis.fileName,
    fileSize: analysis.fileSize,
    binaryHash: analysis.binaryHash,
    textFingerprint: analysis.textFingerprint,
    metadata: analysis.metadata,
    metadataSource: 'pdf_extraction', // Track source: 'pdf_extraction', 'manual_entry', 'verified_issuer'
    metadataConfidence: calculateMetadataConfidence(analysis.metadata), // 0-100: how confident is the extraction
    extractedText: analysis.extractedText,
    ipfsCid,
    status, // 'pending', 'reviewing', 'approved', 'rejected'
    uploadedAt: analysis.timestamp,
    approvedAt: null,
    rejectedAt: null,
    approvedBy: null,
    rejectionReason: null,
  };
  
  certificates.push(record);
  await saveCertificates(certificates);
  
  return record;
};

/**
 * Extract achievement type from certificate metadata
 * Maps certificate names/issuers to achievement types
 */
const extractAchievementType = (metadata) => {
  if (!metadata) return 'CERTIFICATE';
  
  const certName = (metadata.certificateName || '').toLowerCase();
  const issuer = (metadata.issuer || '').toLowerCase();
  const combined = `${certName} ${issuer}`;
  
  // Check for HACKATHON
  if (combined.includes('hackathon') || combined.includes('hack-a-thon')) {
    return 'HACKATHON';
  }
  
  // Check for AWS
  if (combined.includes('aws') || issuer.includes('amazon')) {
    return 'AWS_CERT';
  }
  
  // Check for INTERNSHIP
  if (combined.includes('internship') || combined.includes('intern')) {
    return 'INTERNSHIP';
  }
  
  // Check for GCP
  if (combined.includes('google cloud') || combined.includes('gcp')) {
    return 'GCP_CERT';
  }
  
  // Check for Azure
  if (combined.includes('azure') || combined.includes('microsoft')) {
    return 'AZURE_CERT';
  }
  
  // Default to generic CERTIFICATE
  return 'CERTIFICATE';
};

/**
 * Calculate metadata confidence based on how many fields were successfully extracted
 */
const calculateMetadataConfidence = (metadata) => {
  if (!metadata) return 0;
  
  const fields = ['issuer', 'certificateName', 'recipientName', 'awardDate', 'certificateID', 'qualification'];
  const extractedCount = fields.filter(field => metadata[field] && metadata[field] !== 'Not detected').length;
  
  // Confidence = percentage of fields successfully extracted
  return Math.round((extractedCount / fields.length) * 100);
};

/**
 * Get certificate by ID
 */
export const getCertificateById = async (id) => {
  const certificates = await loadCertificates();
  return certificates.find(c => c.id === id);
};

/**
 * Get all certificates uploaded by a student (sorted by upload date, newest first)
 */
export const getCertificatesByStudent = async (studentEmail) => {
  const certificates = await loadCertificates();
  return certificates
    .filter(c => c.studentEmail === studentEmail)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
};

/**
 * Find potential duplicates by binary hash
 */
export const findByBinaryHash = async (binaryHash) => {
  const certificates = await loadCertificates();
  return certificates.filter(c => c.binaryHash === binaryHash);
};

/**
 * Find potential duplicates by text fingerprint
 */
export const findByTextFingerprint = async (textFingerprint) => {
  const certificates = await loadCertificates();
  return certificates.filter(c => c.textFingerprint === textFingerprint);
};

/**
 * Find similar certificates by metadata
 */
export const findSimilarByMetadata = async (metadata, similarityThreshold = 70) => {
  const certificates = await loadCertificates();
  const similar = [];
  
  certificates.forEach(cert => {
    const certMeta = cert.metadata;
    let matches = 0;
    let totalFields = 0;
    
    const fields = ['issuer', 'certificateName', 'recipientName', 'awardDate'];
    
    fields.forEach(field => {
      if (certMeta[field] || metadata[field]) {
        totalFields++;
        if (
          certMeta[field] &&
          metadata[field] &&
          String(certMeta[field]).toLowerCase() === String(metadata[field]).toLowerCase()
        ) {
          matches++;
        }
      }
    });
    
    const similarity = totalFields > 0 ? Math.round((matches / totalFields) * 100) : 0;
    
    if (similarity >= similarityThreshold) {
      similar.push({
        certificate: cert,
        similarity,
      });
    }
  });
  
  return similar.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Get all pending certificates for review
 */
export const getPendingCertificates = async () => {
  const certificates = await loadCertificates();
  return certificates.filter(c => c.status === 'pending');
};

/**
 * Approve a certificate
 */
export const approveCertificate = async (id, approvedBy) => {
  const certificates = await loadCertificates();
  const cert = certificates.find(c => c.id === id);
  
  if (!cert) {
    throw new Error('Certificate not found');
  }
  
  cert.status = 'approved';
  cert.approvedAt = new Date().toISOString();
  cert.approvedBy = approvedBy;
  
  await saveCertificates(certificates);
  return cert;
};

/**
 * Reject a certificate
 */
export const rejectCertificate = async (id, reason, rejectedBy) => {
  const certificates = await loadCertificates();
  const cert = certificates.find(c => c.id === id);
  
  if (!cert) {
    throw new Error('Certificate not found');
  }
  
  cert.status = 'rejected';
  cert.rejectedAt = new Date().toISOString();
  cert.rejectionReason = reason;
  cert.approvedBy = rejectedBy;
  
  await saveCertificates(certificates);
  return cert;
};

/**
 * Get approved certificates
 */
export const getApprovedCertificates = async () => {
  const certificates = await loadCertificates();
  return certificates.filter(c => c.status === 'approved');
};

/**
 * Check if certificate hash exists
 */
export const certificateHashExists = async (binaryHash) => {
  const certs = await findByBinaryHash(binaryHash);
  return certs.length > 0;
};

/**
 * Delete a certificate by ID
 */
export const deleteCertificate = async (id) => {
  const certificates = await loadCertificates();
  const index = certificates.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Certificate not found');
  }
  
  const deletedCert = certificates[index];
  certificates.splice(index, 1);
  
  await saveCertificates(certificates);
  return deletedCert;
};

/**
 * Get all certificates (for admin view)
 */
export const getAllCertificates = async () => {
  return await loadCertificates();
};
