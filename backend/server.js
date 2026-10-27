import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createHash } from 'crypto';
import FormData from 'form-data';
import axios from 'axios';
import * as pdfAnalysis from './services/pdfAnalysis.js';
import * as certDB from './services/certificateDatabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Helper function to extract achievement type from metadata
const extractAchievementTypeFromMetadata = (metadata) => {
  if (!metadata) return 'Certificate';
  
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
  
  // Check for Kubernetes
  if (combined.includes('kubernetes') || combined.includes('k8s')) {
    return 'KUBERNETES_CERT';
  }
  
  // Default to generic CERTIFICATE
  return 'Certificate';
};

// Configure multer for file uploads (memory storage, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME types
    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, PNG, JPG, GIF`));
    }
  },
});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Certificate hash check endpoint
app.get('/api/certificate/check-hash', async (req, res) => {
  try {
    const { hash } = req.query;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Hash parameter required',
      });
    }

    // Validate hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hash format',
      });
    }

    // For now, always return that certificate doesn't exist
    // (In production, this would query a database or blockchain)
    res.json({
      success: true,
      exists: false,
      certificateInfo: null,
    });
  } catch (error) {
    console.error('Check hash error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check hash',
    });
  }
});

/**
 * Analyze certificate for duplicates
 * POST /api/certificates/analyze
 * Body: multipart/form-data with file
 */
app.post('/api/certificates/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    console.log(`Analyzing certificate: ${req.file.originalname}`);

    // Analyze the certificate
    const analysis = await pdfAnalysis.analyzeCertificate(
      req.file.buffer,
      req.file.originalname
    );

    // Check for exact duplicates (binary hash)
    const exactDuplicates = await certDB.findByBinaryHash(analysis.binaryHash);

    // Check for fingerprint matches (content duplicates)
    const fingerprintMatches = await certDB.findByTextFingerprint(analysis.textFingerprint);

    // Check for similar certificates (metadata)
    const similarCerts = await certDB.findSimilarByMetadata(analysis.metadata, 50); // Lower threshold for more candidates

    // FALLBACK: If no metadata found, check for filename similarity
    let certificatesToCheck = similarCerts;
    if (similarCerts.length === 0 && !analysis.metadata?.recipientName) {
      // Metadata extraction failed - look for same filename from same student
      console.log('Metadata extraction failed, checking by filename similarity...');
      const allCerts = await certDB.getAllCertificates();
      
      // Find certs with similar filename (e.g., "Certificate.pdf" uploaded multiple times)
      const sameFilename = allCerts.filter(cert => {
        const sameName = cert.fileName?.split('_')[0]?.toLowerCase() === 
                        req.file.originalname?.split('_')[0]?.toLowerCase();
        const sameStudent = cert.studentEmail === (req.query.studentEmail || 'unknown@test.com');
        return sameName || (sameStudent && cert.fileName?.includes('Certificate'));
      });
      
      if (sameFilename.length > 0) {
        console.log(`Found ${sameFilename.length} certificates with similar filename`);
        certificatesToCheck = sameFilename.map(c => ({
          certificate: c,
          similarity: 70, // High suspicion for same filename
        }));
      }
    }

    // Use advanced duplicate detector for detailed similarity scoring
    let detailedSimilarities = [];
    try {
      const { findDuplicatesWithContext } = await import('./services/duplicateDetector.js');
      const tempCert = {
        id: 'temp_' + Date.now(),
        ...analysis,
        studentEmail: req.query.studentEmail || 'unknown@test.com',
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };
      detailedSimilarities = findDuplicatesWithContext(tempCert, certificatesToCheck.map(s => s.certificate || s));
    } catch (detectorErr) {
      console.warn('Advanced detector not available, using basic similarity');
      // Fallback to basic similarity calculation
      detailedSimilarities = certificatesToCheck.map(sim => ({
        certificateId: sim.certificate.id || sim.id,
        fileName: sim.certificate.fileName || sim.fileName,
        studentEmail: sim.certificate.studentEmail || sim.studentEmail,
        uploadedAt: sim.certificate.uploadedAt || sim.uploadedAt,
        similarity: {
          baseScore: sim.similarity || 0,
          finalScore: sim.similarity || 0,
          classification: sim.similarity >= 70 ? 'likely_modified' : 'possible_match',
          explanation: sim.similarity >= 70 ? 'Similar metadata found' : 'Possible match found',
          details: {},
        },
      }));
    }

    // DUPLICATE CHECK: Three possible outcomes
    // 1. Exact binary match - same file uploaded twice
    // 2. Exact text match - identical content, different file
    // 3. Similar metadata - content modified
    // NOTE: If metadata extraction fails, fall back to binary/text hashes
    
    const isDuplicate = exactDuplicates.length > 0 || fingerprintMatches.length > 0;
    const hasSimilarMetadata = detailedSimilarities.length > 0 && detailedSimilarities[0].similarity?.finalScore >= 50;

    if (isDuplicate) {
      // Exact match - same PDF uploaded twice (binary hash or text fingerprint)
      return res.status(409).json({
        success: false,
        error: 'Error: Certificate already uploaded',
        isDuplicate: true,
        type: 'exact_match',
      });
    }

    if (hasSimilarMetadata) {
      // Metadata extraction successful - show detailed field changes
      const matchedCert = detailedSimilarities[0];
      const details = matchedCert.similarity?.details || {};
      
      // Build a message showing what changed
      const changes = [];
      if (details.recipientName) {
        const { val1, val2 } = details.recipientName;
        if (val1 && val2 && val1 !== val2) {
          changes.push(`Name: ${val1} → ${val2}`);
        }
      }
      if (details.issuer) {
        const { val1, val2 } = details.issuer;
        if (val1 && val2 && val1 !== val2) {
          changes.push(`Issuer: ${val1} → ${val2}`);
        }
      }
      if (details.awardDate) {
        const { val1, val2 } = details.awardDate;
        if (val1 && val2 && val1 !== val2) {
          changes.push(`Date: ${val1} → ${val2}`);
        }
      }
      
      const changesStr = changes.length > 0 ? ` Changed fields: ${changes.join(', ')}` : '';
      
      return res.status(409).json({
        success: false,
        error: `Error: 100% matched to some previous certificate${changesStr}`,
        isDuplicate: true,
        type: 'modified_duplicate',
        matchDetails: {
          originalCertificate: matchedCert.fileName,
          originalUploadedAt: matchedCert.uploadedAt,
          similarity: matchedCert.similarity?.finalScore,
          changedFields: details,
        },
      });
    }

    // Certificate is unique - allow upload
    res.json({
      success: true,
      analysis,
      isDuplicate: false,
      message: 'Certificate is unique and ready for upload',
    });
  } catch (error) {
    console.error('Certificate analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Certificate analysis failed',
    });
  }
});

/**
 * Get student's certificate history
 * GET /api/certificates/history/:studentEmail
 */
app.get('/api/certificates/history/:studentEmail', async (req, res) => {
  try {
    const { studentEmail } = req.params;
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        error: 'studentEmail is required',
      });
    }

    const certificates = await certDB.getCertificatesByStudent(studentEmail);
    res.json({
      success: true,
      certificates: certificates.map(c => ({
        id: c.id,
        fileName: c.fileName,
        fileSize: c.fileSize,
        achievementType: c.achievementType || extractAchievementTypeFromMetadata(c.metadata) || 'Certificate',
        issuer: c.metadata?.issuer,
        status: c.status || 'pending',
        timestamp: c.uploadedAt || c.timestamp,
        uploadedAt: c.uploadedAt,
        approvedAt: c.approvedAt,
        approvedDate: c.approvedAt,
        rejectedAt: c.rejectedAt,
        rejectionReason: c.rejectionReason,
        reason: c.rejectionReason,
        ipfsCid: c.ipfsCid,
        proofURI: c.proofURI || (c.ipfsCid ? `ipfs://${c.ipfsCid}` : ''),
        studentWallet: c.studentWallet,
        analysis: c.analysis,
      })),
    });
  } catch (error) {
    console.error('Get certificate history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch certificate history',
    });
  }
});

/**
 * Get pending certificates for verifier review
 * GET /api/certificates/pending
 */
app.get('/api/certificates/pending', async (req, res) => {
  try {
    const pending = await certDB.getPendingCertificates();
    res.json({
      success: true,
      certificates: pending,
    });
  } catch (error) {
    console.error('Get pending certificates error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pending certificates',
    });
  }
});

/**
 * Delete a certificate
 * DELETE /api/certificates/:id
 */
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const cert = await certDB.deleteCertificate(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }

    res.json({
      success: true,
      message: 'Certificate deleted successfully',
      certificateId: req.params.id,
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete certificate',
    });
  }
});

/**
 * Get certificate details by ID
 * GET /api/certificates/:id
 */
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const cert = await certDB.getCertificateById(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }
    res.json({
      success: true,
      certificate: cert,
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch certificate',
    });
  }
});

/**
 * Approve a certificate and award SkillCoins
 * POST /api/certificates/:id/approve
 */
app.post('/api/certificates/:id/approve', async (req, res) => {
  try {
    const { approvedBy, studentWallet } = req.body;
    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        error: 'approvedBy is required',
      });
    }

    const cert = await certDB.approveCertificate(req.params.id, approvedBy);
    
    // Attempt to award SkillCoins if wallet is provided
    let coinReward = null;
    if (studentWallet && process.env.CONTRACT_ADDRESSES) {
      try {
        const contractAddresses = JSON.parse(process.env.CONTRACT_ADDRESSES);
        const achievementRegistry = contractAddresses.AchievementRegistry;
        
        if (achievementRegistry) {
          // Determine achievement type from certificate metadata
          const issuer = cert.metadata?.issuer?.toLowerCase() || '';
          let achievementType = 'CERTIFICATE';
          let rewardAmount = 100; // Default reward in SKC
          
          if (issuer.includes('aws')) {
            achievementType = 'AWS_CERT';
            rewardAmount = 150;
          } else if (issuer.includes('google')) {
            achievementType = 'GCP_CERT';
            rewardAmount = 150;
          } else if (issuer.includes('coursera') || issuer.includes('edx')) {
            achievementType = 'ONLINE_COURSE';
            rewardAmount = 100;
          }
          
          // Log the reward action (in production, call smart contract via ethers.js)
          coinReward = {
            achievementType,
            rewardAmount,
            studentWallet,
            transactionStatus: 'pending', // Would be 'confirmed' after blockchain call
            note: 'SkillCoins reward to be processed via smart contract'
          };
          
          console.log(`💰 SkillCoin Reward Scheduled:`);
          console.log(`   Student: ${studentWallet}`);
          console.log(`   Achievement: ${achievementType}`);
          console.log(`   Amount: ${rewardAmount} SKC`);
        }
      } catch (coinError) {
        console.warn('Could not process SkillCoin reward:', coinError.message);
        // Continue with approval even if coin reward fails
      }
    }
    
    res.json({
      success: true,
      certificate: cert,
      coinReward,
      message: 'Certificate approved successfully' + (coinReward ? ' and SkillCoins queued for reward' : ''),
    });
  } catch (error) {
    console.error('Approve certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve certificate',
    });
  }
});

/**
 * Reject a certificate
 * POST /api/certificates/:id/reject
 */
app.post('/api/certificates/:id/reject', async (req, res) => {
  try {
    const { reason, rejectedBy } = req.body;
    if (!reason || !rejectedBy) {
      return res.status(400).json({
        success: false,
        error: 'reason and rejectedBy are required',
      });
    }

    const cert = await certDB.rejectCertificate(req.params.id, reason, rejectedBy);
    res.json({
      success: true,
      certificate: cert,
      message: 'Certificate rejected successfully',
    });
  } catch (error) {
    console.error('Reject certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject certificate',
    });
  }
});

/**
 * Store certificate in database after IPFS upload
 * POST /api/certificates/store
 * Body: { analysis, studentEmail, studentWallet, ipfsCid }
 */
app.post('/api/certificates/store', async (req, res) => {
  try {
    const { analysis, studentEmail, studentWallet, ipfsCid } = req.body;
    if (!analysis || !studentEmail || !ipfsCid) {
      return res.status(400).json({
        success: false,
        error: 'analysis, studentEmail, and ipfsCid are required',
      });
    }

    // studentWallet is optional but recommended
    const record = await certDB.storeCertificate(analysis, studentEmail, ipfsCid, 'pending', studentWallet);
    res.json({
      success: true,
      record,
      message: 'Certificate stored for review',
    });
  } catch (error) {
    console.error('Store certificate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to store certificate',
    });
  }
});

// IPFS upload endpoint
app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Check Pinata credentials
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Pinata credentials not configured',
      });
    }

    console.log(`Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

    try {
      // Create FormData with file buffer
      const formData = new FormData();
      formData.append('file', req.file.buffer, req.file.originalname);

      console.log(`📤 Uploading to Pinata: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Use axios to upload to Pinata - handles FormData correctly
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'pinata_api_key': process.env.PINATA_API_KEY,
            'pinata_secret_api_key': process.env.PINATA_API_SECRET,
          },
        }
      );

      const ipfsCid = response.data.IpfsHash;

      if (!ipfsCid) {
        throw new Error(`No IPFS hash in Pinata response: ${JSON.stringify(response.data)}`);
      }

      console.log(`✅ Successfully uploaded to IPFS: ${ipfsCid}`);

      // Compute SHA-256 hash of the file for verification
      const hash = createHash('sha256').update(req.file.buffer).digest('hex');
      const hashHex = `0x${hash}`;

      console.log(`✅ Successfully uploaded to IPFS: ${ipfsCid}`);

      res.json({
        success: true,
        ipfsCid,
        hash: hashHex,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        message: 'File uploaded successfully to IPFS',
      });
    } catch (pinataError) {
      console.error('Pinata error:', pinataError.message);
      if (pinataError.response) {
        console.error('Pinata response status:', pinataError.response.status);
        console.error('Pinata response data:', pinataError.response.data);
      }
      throw pinataError;
    }
  } catch (error) {
    console.error('Upload error:', error.message);

    // Handle axios errors
    if (error.response) {
      // Axios error with response
      return res.status(error.response.status || 500).json({
        success: false,
        error: error.response.data?.error || error.message || 'Upload failed',
      });
    }

    // Handle specific errors
    if (error.message.includes('API key') || error.message.includes('secret') || error.message.includes('401') || error.message.includes('403')) {
      return res.status(401).json({
        success: false,
        error: 'Pinata authentication failed. Check your API key and secret in .env',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'File upload failed',
    });
  }
});

/**
 * Get duplicate groups
 * GET /api/certificates/duplicate-groups
 * Query params: { threshold: 70 }
 */
app.get('/api/certificates/duplicate-groups', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 70;
    const certificates = await certDB.getAllCertificates();

    // Import grouping function
    const { groupDuplicates } = await import('./services/duplicateDetector.js').catch(() => ({}));
    
    if (!groupDuplicates) {
      return res.json({
        success: true,
        groups: [],
        message: 'Advanced grouping not available',
      });
    }

    const groups = groupDuplicates(certificates, threshold);

    res.json({
      success: true,
      groups: groups.map((group, idx) => ({
        groupId: `group_${idx}`,
        size: group.length,
        certificates: group.map(c => ({
          id: c.id,
          fileName: c.fileName,
          studentEmail: c.studentEmail,
          uploadedAt: c.uploadedAt,
          status: c.status,
          issuer: c.metadata?.issuer,
        })),
      })),
      totalGroups: groups.length,
      threshold,
    });
  } catch (error) {
    console.error('Get duplicate groups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve duplicate groups',
    });
  }
});

/**
 * Mark certificate for manual review
 * POST /api/certificates/:id/mark-review
 */
app.post('/api/certificates/:id/mark-review', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Review reason required',
      });
    }

    const cert = await certDB.getCertificateById(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }

    // Update certificate with review flag
    const certificates = await certDB.loadCertificates?.() || [];
    const idx = certificates.findIndex(c => c.id === req.params.id);
    if (idx >= 0) {
      certificates[idx].status = 'review';
      certificates[idx].reviewReason = reason;
      certificates[idx].reviewAt = new Date().toISOString();
      await certDB.saveCertificates?.(certificates);
    }

    res.json({
      success: true,
      certificate: cert,
      message: 'Certificate marked for manual review',
    });
  } catch (error) {
    console.error('Mark review error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark for review',
    });
  }
});

/**
 * Get similarity details between two certificates
 * GET /api/certificates/compare/:id1/:id2
 */
app.get('/api/certificates/compare/:id1/:id2', async (req, res) => {
  try {
    const cert1 = await certDB.getCertificateById(req.params.id1);
    const cert2 = await certDB.getCertificateById(req.params.id2);

    if (!cert1 || !cert2) {
      return res.status(404).json({
        success: false,
        error: 'One or both certificates not found',
      });
    }

    // Import similarity calculator
    const { calculateDetailedSimilarity } = await import('./services/duplicateDetector.js').catch(() => ({}));
    
    let similarity = {
      score: 0,
      details: {},
      explanation: 'Comparison unavailable',
    };

    if (calculateDetailedSimilarity) {
      similarity = calculateDetailedSimilarity(cert1, cert2);
    }

    res.json({
      success: true,
      certificates: {
        cert1: {
          id: cert1.id,
          fileName: cert1.fileName,
          metadata: cert1.metadata,
        },
        cert2: {
          id: cert2.id,
          fileName: cert2.fileName,
          metadata: cert2.metadata,
        },
      },
      similarity,
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare certificates',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        error: 'File too large (max 10MB)',
      });
    }
  }

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 SkillChain Backend running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`\n📋 Certificate Management Endpoints:`);
  console.log(`   POST   /api/certificates/analyze - Analyze certificate for duplicates`);
  console.log(`   GET    /api/certificates/pending - Get pending certificates for review`);
  console.log(`   GET    /api/certificates/:id - Get certificate details`);
  console.log(`   POST   /api/certificates/:id/approve - Approve certificate`);
  console.log(`   POST   /api/certificates/:id/reject - Reject certificate`);
  console.log(`   POST   /api/certificates/store - Store certificate in database`);
  console.log(`\n📦 IPFS Endpoint:`);
  console.log(`   POST   /api/ipfs/upload - Upload file to IPFS`);
  console.log(`\n❤️  Health Check:`);
  console.log(`   GET    /api/health - Server health check\n`);
});
