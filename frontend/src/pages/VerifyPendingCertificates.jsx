import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, AlertCircle, Copy, ExternalLink, Download, Eye, Archive } from 'lucide-react';

const VerifyPendingCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!user || !['verifier', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  // Load pending certificates from localStorage
  useEffect(() => {
    const loadCertificates = async () => {
      try {
        // Get all certificates uploaded by students
        const storedCerts = localStorage.getItem('pending_certificates');
        if (storedCerts) {
          const certs = JSON.parse(storedCerts);
          setCertificates(certs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load certificates');
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const handleApproveCertificate = (cert) => {
    // Move to registered certificates
    const registeredCerts = JSON.parse(localStorage.getItem('registered_certificates') || '[]');
    registeredCerts.push({ ...cert, status: 'registered', registeredAt: new Date().toISOString() });
    localStorage.setItem('registered_certificates', JSON.stringify(registeredCerts));

    // Remove from pending
    const updatedCerts = certificates.filter(c => c.hash !== cert.hash);
    setCertificates(updatedCerts);
    localStorage.setItem('pending_certificates', JSON.stringify(updatedCerts));

    setSelectedCert(null);
    alert('✅ Certificate approved and registered!');
  };

  const handleRejectCertificate = (cert) => {
    const updatedCerts = certificates.filter(c => c.hash !== cert.hash);
    setCertificates(updatedCerts);
    localStorage.setItem('pending_certificates', JSON.stringify(updatedCerts));
    setSelectedCert(null);
    alert('❌ Certificate rejected');
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkForDuplicate = (currentHash, issuer) => {
    // Check if same hash was registered before (exact duplicate)
    const registeredCerts = JSON.parse(localStorage.getItem('registered_certificates') || '[]');
    const exactDuplicate = registeredCerts.find(c => c.hash === currentHash);
    
    // Check if similar certificates from same issuer (potential fraud)
    const similarCerts = registeredCerts.filter(c => 
      c.issuer === issuer && 
      c.hash !== currentHash &&
      Math.abs(new Date(c.uploadedAt) - new Date(currentHash)) < 86400000 // Within 24 hours
    );

    return { exactDuplicate, similarCerts };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Review Pending Certificates</h1>
          <p className="text-gray-600 mt-2">
            Verify student uploads before registering them on blockchain
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
            <p className="text-gray-600 mt-2">All student uploads have been reviewed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Certificate List */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white px-4 py-3 font-semibold">
                  Pending Uploads ({certificates.length})
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {certificates.map((cert, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCert(cert)}
                      className={`w-full text-left px-4 py-4 hover:bg-blue-50 transition border-l-4 ${
                        selectedCert?.hash === cert.hash
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {cert.studentEmail?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(cert.uploadedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-mono text-gray-500 mt-1 truncate">
                        {cert.hash?.slice(0, 10)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="lg:col-span-2">
              {selectedCert ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Certificate Details</h2>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Student Email</p>
                        <p className="text-gray-900 mt-1">{selectedCert.studentEmail}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">File Name</p>
                        <p className="text-gray-900 mt-1 font-mono text-sm break-all">
                          {selectedCert.fileName}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">File Size</p>
                        <p className="text-gray-900 mt-1">
                          {(selectedCert.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">Uploaded At</p>
                        <p className="text-gray-900 mt-1">
                          {new Date(selectedCert.uploadedAt).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">IPFS CID</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm font-mono text-gray-900 flex-1 break-all bg-gray-50 p-2 rounded">
                            {selectedCert.ipfsCid}
                          </p>
                          <button
                            onClick={() => handleCopyToClipboard(selectedCert.ipfsCid)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">Keccak-256 Hash</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm font-mono text-gray-900 flex-1 break-all bg-gray-50 p-2 rounded">
                            {selectedCert.hash}
                          </p>
                          <button
                            onClick={() => handleCopyToClipboard(selectedCert.hash)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Check */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <AlertCircle size={20} className="text-amber-600" />
                      <span>Duplicate Check</span>
                    </h3>

                    {(() => {
                      const { exactDuplicate, similarCerts } = checkForDuplicate(
                        selectedCert.hash,
                        selectedCert.issuer
                      );

                      return (
                        <div className="space-y-3">
                          {exactDuplicate ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              ⚠️ <strong>Exact Duplicate Found!</strong> This hash was already registered.
                            </div>
                          ) : (
                            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                              ✅ No exact duplicates found
                            </div>
                          )}

                          {similarCerts.length > 0 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              ⚠️ {similarCerts.length} similar certificate(s) from same issuer
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Preview */}
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
                  <div className="flex space-x-3 pt-6 border-t">
                    <button
                      onClick={() => handleApproveCertificate(selectedCert)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={20} />
                      <span>Approve & Register</span>
                    </button>
                    <button
                      onClick={() => handleRejectCertificate(selectedCert)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
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

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Verifier Workflow</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ <strong>Step 1:</strong> Review certificate uploads from students</li>
            <li>✓ <strong>Step 2:</strong> Check for exact duplicates (same hash)</li>
            <li>✓ <strong>Step 3:</strong> Check for similar certificates (fraud detection)</li>
            <li>✓ <strong>Step 4:</strong> Approve and register hash on blockchain</li>
            <li>✓ <strong>Step 5:</strong> Students can now claim achievements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyPendingCertificates;
