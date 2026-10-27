import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, AlertCircle, AlertTriangle, Copy, ExternalLink, Eye, Archive, TrendingUp, Shield } from 'lucide-react';

const VerifyDuplicateDetection = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!user || !['verifier', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  // Load pending certificates from backend
  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const response = await fetch(`${backendUrl}/api/certificates/pending`);
        
        if (response.ok) {
          const data = await response.json();
          setCertificates(data.certificates.sort((a, b) => 
            new Date(b.uploadedAt) - new Date(a.uploadedAt)
          ));
        }
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load from backend, using mock data');
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const handleApproveCertificate = async (cert) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/certificates/${cert.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvedBy: user.email,
          studentWallet: cert.studentEmail // Pass student email as wallet identifier for now
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(certificates.filter(c => c.id !== cert.id));
        setSelectedCert(null);
        
        let message = '✅ Certificate approved and registered!';
        if (data.coinReward) {
          message += `\n💰 SkillCoins scheduled: ${data.coinReward.rewardAmount} SKC for ${data.coinReward.achievementType}`;
        }
        alert(message);
      }
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    }
  };

  const handleRejectCertificate = async (cert, reason) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/certificates/${cert.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: reason || 'Rejected by verifier',
          rejectedBy: user.email 
        }),
      });

      if (response.ok) {
        setCertificates(certificates.filter(c => c.id !== cert.id));
        setSelectedCert(null);
        alert('❌ Certificate rejected');
      }
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const DuplicateWarning = ({ cert }) => {
    if (!cert.duplicateAnalysis) return null;

    const { flags, exactDuplicates, fingerprintMatches, similarCertificates } = cert.duplicateAnalysis;

    if (flags.isExactDuplicate) {
      return (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-red-900">🚨 EXACT DUPLICATE</p>
              <p className="text-sm text-red-800 mt-1">This certificate has the exact same binary hash as a previous upload.</p>
              <p className="text-xs text-red-700 mt-2"><strong>Recommendation:</strong> REJECT - This is fraud</p>
              {exactDuplicates.length > 0 && (
                <div className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded">
                  <p><strong>Matched with:</strong></p>
                  {exactDuplicates.map(dup => (
                    <p key={dup.id}>{dup.fileName} ({dup.studentEmail})</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (flags.isContentDuplicate) {
      return (
        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-orange-900">⚠️ CONTENT MATCH DETECTED</p>
              <p className="text-sm text-orange-800 mt-1">The extracted text fingerprint matches a previous upload, even though the binary file is different.</p>
              <p className="text-xs text-orange-700 mt-2"><strong>Possible cause:</strong> File was re-saved or reformatted without changing content</p>
              <p className="text-xs text-orange-700"><strong>Recommendation:</strong> REJECT - Same certificate content</p>
              {fingerprintMatches.length > 0 && (
                <div className="mt-2 text-xs text-orange-800 bg-orange-100 p-2 rounded">
                  <p><strong>Matched with:</strong></p>
                  {fingerprintMatches.map(match => (
                    <p key={match.id}>{match.fileName} ({match.studentEmail})</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (flags.isSuspectedModified && similarCertificates.length > 0) {
      const topMatch = similarCertificates[0];
      const similarityScore = topMatch?.similarity?.finalScore;
      const similarityClassification = topMatch?.similarity?.classification;
      
      return (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-yellow-900">🔍 SUSPECTED MODIFIED COPY</p>
              {similarityScore !== undefined ? (
                <p className="text-sm text-yellow-800 mt-1">
                  High similarity ({similarityScore}% - {similarityClassification}) to existing certificate, but binary content differs.
                </p>
              ) : (
                <p className="text-sm text-yellow-800 mt-1">
                  Similarities detected to existing certificate, but binary content differs.
                </p>
              )}
              <p className="text-xs text-yellow-700 mt-2"><strong>Possible cause:</strong> Edited in Preview or marked up</p>
              
              {/* Show differences */}
              {topMatch.comparison && topMatch.comparison.differences && Object.keys(topMatch.comparison.differences).length > 0 && (
                <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                  <p className="font-semibold text-sm text-yellow-900 mb-2">📋 Detected Changes:</p>
                  <div className="space-y-1 text-xs text-yellow-800">
                    {Object.entries(topMatch.comparison.differences).map(([field, diff]) => (
                      <div key={field} className="flex flex-col space-y-0.5">
                        <span className="font-semibold capitalize">{field}:</span>
                        <span className="text-red-600">- {diff.original}</span>
                        <span className="text-green-600">+ {diff.modified}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-yellow-700 mt-2"><strong>Recommendation:</strong> VERIFY MANUALLY - Check if changes are legitimate</p>
              <div className="mt-2 text-xs text-yellow-800 bg-yellow-100 p-2 rounded">
                <p><strong>Compared with:</strong></p>
                <p>{topMatch.fileName} ({topMatch.studentEmail})</p>
                <p>Uploaded: {new Date(topMatch.uploadedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
        <div className="flex items-start space-x-3">
          <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-green-900">✓ NO DUPLICATES DETECTED</p>
            <p className="text-sm text-green-800 mt-1">This certificate appears to be unique and authentic.</p>
            <p className="text-xs text-green-700 mt-2"><strong>Recommendation:</strong> APPROVE - Safe to register</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Review Pending Certificates</h1>
          <p className="text-gray-600 mt-2">
            Advanced duplicate detection: exact matches, content fingerprints, metadata analysis
          </p>
        </div>

        {error && <Alert type="error" title="Error" message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Archive size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Pending Certificates</h3>
            <p className="text-gray-600 mt-2">All uploads have been reviewed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Certificate List */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-4">
                <div className="bg-blue-600 text-white px-4 py-3 font-semibold">
                  Pending ({certificates.length})
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {certificates.map((cert, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCert(cert)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition border-l-4 ${
                        selectedCert?.id === cert.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {cert.studentEmail?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(cert.uploadedAt).toLocaleDateString()}
                      </p>
                      {cert.duplicateAnalysis?.flags?.isExactDuplicate && (
                        <span className="text-xs text-red-600 font-bold">⛔ EXACT DUP</span>
                      )}
                      {cert.duplicateAnalysis?.flags?.isContentDuplicate && (
                        <span className="text-xs text-orange-600 font-bold">⚠️ CONTENT MATCH</span>
                      )}
                      {cert.duplicateAnalysis?.flags?.isSuspectedModified && (
                        <span className="text-xs text-yellow-600 font-bold">🔍 MODIFIED?</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="lg:col-span-2">
              {selectedCert ? (
                <div className="space-y-6">
                  {/* Duplicate Detection Alert */}
                  <DuplicateWarning cert={selectedCert} />

                  {/* Certificate Details */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Certificate Details</h2>

                    {/* Student Wallet Address - HIGHLIGHTED */}
                    {selectedCert.studentWallet && (
                      <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-2">💰 Student's Wallet Address</p>
                        <p className="font-mono text-blue-900 break-all text-sm bg-white p-2 rounded">{selectedCert.studentWallet}</p>
                        <p className="text-xs text-blue-800 mt-2">📝 Copy and use this wallet address in the Approve Achievement form to award SkillCoins to this student</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Student Email</p>
                        <p className="text-gray-900 mt-1 text-sm">{selectedCert.studentEmail}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        <p className="text-gray-900 mt-1 text-sm capitalize font-semibold">{selectedCert.status}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">File Name</p>
                        <p className="text-gray-900 mt-1 text-sm font-mono truncate">{selectedCert.fileName}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">File Size</p>
                        <p className="text-gray-900 mt-1 text-sm">{(selectedCert.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-600">Binary Hash (SHA-256)</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-2 rounded flex-1">
                            {selectedCert.binaryHash}
                          </p>
                          <button onClick={() => handleCopyToClipboard(selectedCert.binaryHash)} className="p-1 hover:bg-gray-100 rounded">
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-600">Text Fingerprint (SHA-256)</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-2 rounded flex-1">
                            {selectedCert.textFingerprint || 'Not available'}
                          </p>
                          {selectedCert.textFingerprint && (
                            <button onClick={() => handleCopyToClipboard(selectedCert.textFingerprint)} className="p-1 hover:bg-gray-100 rounded">
                              <Copy size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Metadata with Confidence and Source */}
                  {selectedCert.metadata && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <Shield size={20} />
                          <span>Extracted Metadata</span>
                        </h3>
                        {selectedCert.metadataConfidence !== undefined && (
                          <div className="text-sm">
                            <span className={`px-3 py-1 rounded-full font-medium ${
                              selectedCert.metadataConfidence >= 80 ? 'bg-green-100 text-green-800' :
                              selectedCert.metadataConfidence >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedCert.metadataConfidence}% confidence
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(selectedCert.metadata || {}).map(([key, value]) => {
                          const isNotDetected = value === 'Not detected';
                          const fieldName = key.replace(/([A-Z])/g, ' $1').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                          
                          return (
                            <div key={key} className={isNotDetected ? 'opacity-75' : ''}>
                              <p className="font-medium text-gray-600">{fieldName}</p>
                              <p className={isNotDetected ? 'text-gray-500 italic' : 'text-gray-900'}>
                                {value}
                              </p>
                              {isNotDetected && (
                                <p className="text-xs text-gray-500 mt-1">Verifier can enter or correct</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {selectedCert.metadataSource && (
                        <div className="pt-3 border-t text-xs text-gray-600">
                          <p>
                            <strong>Source:</strong> {
                              selectedCert.metadataSource === 'pdf_extraction' ? 'Extracted from PDF' :
                              selectedCert.metadataSource === 'manual_entry' ? 'Manually entered by verifier' :
                              selectedCert.metadataSource === 'verified_issuer' ? 'Verified against trusted issuer' :
                              selectedCert.metadataSource
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IPFS Preview */}
                  {selectedCert.ipfsCid && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <Eye size={20} />
                        <span>Preview</span>
                      </h3>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${selectedCert.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <span>View on IPFS Gateway</span>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900">📝 Verify & Correct Metadata</h3>
                    <p className="text-sm text-gray-600">If extraction was inaccurate, verify the values below before approval.</p>
                    <div className="text-xs text-gray-600 bg-white p-3 rounded border space-y-1">
                      <p>• If a field shows "Not detected", the extraction failed for that field</p>
                      <p>• Verify issuer authenticity - extracted values are not proof of legitimacy</p>
                      <p>• Manual correction by a verifier increases metadata confidence</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-6 border-t">
                    <button
                      onClick={() => handleApproveCertificate(selectedCert)}
                      disabled={selectedCert.status !== 'pending'}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={20} />
                      <span>Approve & Register</span>
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleRejectCertificate(selectedCert, reason);
                      }}
                      disabled={selectedCert.status !== 'pending'}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <Eye size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a certificate to review</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detection Legend */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🔍 Duplicate Detection Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="font-bold">Exact Duplicate</span>
              </div>
              <p className="text-gray-600 text-xs">Same binary hash = exact same file uploaded twice. Action: REJECT</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                <span className="font-bold">Content Match</span>
              </div>
              <p className="text-gray-600 text-xs">Same text fingerprint = file resaved or reformatted. Action: REJECT</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                <span className="font-bold">Suspected Modified</span>
              </div>
              <p className="text-gray-600 text-xs">High metadata match (70%+) but different binary = possibly edited. Action: VERIFY</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDuplicateDetection;
