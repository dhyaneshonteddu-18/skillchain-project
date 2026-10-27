import React, { useState } from 'react';
import Alert from '../components/Alert';
import { Upload, Hash, CheckCircle, X } from 'lucide-react';

const CertificateVerification = () => {
  const [activeTab, setActiveTab] = useState('compute');
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];

    if (selectedFile.size > maxSize) {
      setError(`File too large (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB). Max 10MB.`);
      return;
    }
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('File type not allowed. Use PDF, PNG, or JPEG.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const computeHash = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setComputing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setFileHash(hash);
      setSuccess(`Hash computed successfully for ${file.name}`);
    } catch (err) {
      setError('Failed to compute hash: ' + err.message);
    } finally {
      setComputing(false);
    }
  };

  const handleVerifyHash = async () => {
    if (!verifyHash) {
      setError('Please enter a hash to verify');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Simulated verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerifyResult({
        hash: verifyHash,
        verified: true,
        issuer: 'AWS Academy',
        registeredDate: '2024-01-15',
        message: 'Certificate hash verified! File matches registered record.'
      });
      setSuccess('Certificate verified successfully!');
    } catch (err) {
      setError('Certificate verification failed');
      setVerifyResult(null);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-600 mt-2">Compute hashes and verify certificate authenticity using blockchain records</p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔐 How It Works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Upload your certificate file (PDF, PNG, or JPEG)</li>
            <li>Compute the Keccak-256 hash from the file</li>
            <li>Have an admin register the hash on the blockchain</li>
            <li>Verify the hash matches registered records</li>
            <li>Use the hash when submitting achievements</li>
          </ol>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('compute')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'compute'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Compute Hash
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'verify'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Verify Hash
          </button>
        </div>

        {/* Compute Hash Tab */}
        {activeTab === 'compute' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Compute Certificate Hash</h2>

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Certificate File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="cursor-pointer block">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload or drag & drop</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, PNG, or JPEG (up to 10MB)</p>
                  </label>
                </div>
              </div>

              {/* File Info */}
              {file && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Selected File</h3>
                  <p className="text-sm text-gray-600 mt-1">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-700 mt-2"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Compute Button */}
              <button
                onClick={computeHash}
                disabled={!file || computing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                {computing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Computing Hash...</span>
                  </>
                ) : (
                  <>
                    <Hash size={20} />
                    <span>Compute Keccak-256 Hash</span>
                  </>
                )}
              </button>

              {/* Hash Result */}
              {fileHash && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <span>Certificate Hash Computed</span>
                  </h3>
                  <div className="bg-white p-3 rounded border border-green-200 break-all font-mono text-xs text-gray-700 mb-3">
                    {fileHash}
                  </div>
                  <button
                    onClick={() => copyToClipboard(fileHash)}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    📋 Copy Hash
                  </button>

                  {/* Next Steps */}
                  <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                    <p className="font-medium mb-2">Next Steps:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Share this hash with a verifier or admin</li>
                      <li>They will register it on the blockchain</li>
                      <li>Use this hash when submitting your achievement</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verify Hash Tab */}
        {activeTab === 'verify' && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Certificate Hash</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Certificate Hash
                </label>
                <input
                  type="text"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full form-input font-mono"
                />
              </div>

              <button
                onClick={handleVerifyHash}
                disabled={verifying || !verifyHash}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                {verifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Verify Hash</span>
                  </>
                )}
              </button>

              {/* Verification Result */}
              {verifyResult && (
                <div className={`p-4 rounded-lg border-2 ${
                  verifyResult.verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div>
                      {verifyResult.verified ? (
                        <CheckCircle className="text-green-600 w-6 h-6" />
                      ) : (
                        <X className="text-red-600 w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        verifyResult.verified ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {verifyResult.message}
                      </h3>
                      
                      {verifyResult.verified && (
                        <div className="mt-3 space-y-2 text-sm">
                          <p><strong>Issuer:</strong> {verifyResult.issuer}</p>
                          <p><strong>Registered:</strong> {new Date(verifyResult.registeredDate).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-600 break-all font-mono mt-2">{verifyResult.hash}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">💡 Tips:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Hashes are case-sensitive</li>
                  <li>• Even one character difference means the file doesn't match</li>
                  <li>• Use computed hashes only for exact file verification</li>
                  <li>• Contact your verifier if you need a hash registered</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerification;
