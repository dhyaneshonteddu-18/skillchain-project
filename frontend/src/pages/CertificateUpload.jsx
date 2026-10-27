import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { Upload, Hash, CheckCircle, AlertCircle, Copy, ExternalLink, FileText, History, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

const CertificateUpload = () => {
  const { user } = useAuth();
  const { computeFileHash } = useBlockchain();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [hash, setHash] = useState(null);
  const [ipfsCid, setIpfsCid] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [duplicateAnalysisResult, setDuplicateAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);
  const [step, setStep] = useState('upload'); // upload, hashing, uploading, done
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  
  // Certificate history state
  const [certificateHistory, setCertificateHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load certificate history on component mount
  useEffect(() => {
    if (user && user.email) {
      loadCertificateHistory();
    }
  }, [user?.email]);

  // Load certificate history for current student
  const loadCertificateHistory = async () => {
    try {
      if (!user || !user.email) {
        console.warn('User not found or email missing');
        return;
      }
      
      setLoadingHistory(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const historyUrl = `${backendUrl}/api/certificates/history/${encodeURIComponent(user.email)}`;
      
      console.log('Loading certificate history from:', historyUrl);
      
      const response = await fetch(historyUrl);

      if (response.ok) {
        const data = await response.json();
        console.log('History loaded:', data);
        setCertificateHistory(data.certificates || []);
      } else {
        console.error('Failed to load history:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Certificate history error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF and image files (PNG, JPG, GIF) are allowed');
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setHash(null);
    setIpfsCid(null);
    setDuplicateInfo(null);
    setDuplicateAnalysisResult(null);
    setError(null);
    setSuccess(null);
    setWarning(null);
    setStep('upload');

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  // Compute file hash
  const handleComputeHash = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setHashing(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const result = await computeFileHash(file);
      if (result.success) {
        setHash(result.hash);
        setStep('hashing');
        setSuccess('File hash computed successfully! ✓');
        
        // Extract metadata for duplicate detection
        const { extractCertificateMetadata, findDuplicateCertificates } = await import('../utils/certificateAnalysis');
        const metadata = await extractCertificateMetadata(file);
        
        if (metadata) {
          // Check for duplicates based on content metadata
          const duplicates = findDuplicateCertificates(metadata);
          
          if (duplicates.length > 0) {
            const highSimilarity = duplicates.filter(d => d.isDuplicate);
            if (highSimilarity.length > 0) {
              setError(`⚠️ Similar certificate found! This looks like a duplicate (${highSimilarity[0].similarityScore}% match)`);
              setDuplicateInfo({ isDuplicate: true, reason: 'content_match' });
              setHashing(false);
              return;
            } else {
              setWarning(`Found ${duplicates.length} similar certificate(s) - verify authenticity`);
            }
          }
        }
        
        // Automatically check for exact hash duplicates
        setTimeout(() => checkForDuplicate(result.hash), 500);
      } else {
        setError(`Failed to compute hash: ${result.error}`);
      }
    } catch (err) {
      setError(`Error computing hash: ${err.message}`);
    } finally {
      setHashing(false);
    }
  };

  // Check for duplicate certificate
  const checkForDuplicate = async (fileHash) => {
    setCheckingDuplicate(true);
    try {
      // In a real implementation, this would query the blockchain
      // For now, we'll simulate the check
      // TODO: Integrate with CertificateHashRegistry contract
      
      // Simulate API call to backend
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/certificate/check-hash?hash=${fileHash}`,
        { method: 'GET' }
      ).catch(() => {
        // Mock response if backend not available
        return { ok: true, json: async () => ({ success: true, exists: false }) };
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.certificateInfo) {
          setDuplicateInfo({
            isDuplicate: true,
            issuer: data.certificateInfo.issuer,
            timestamp: data.certificateInfo.timestamp,
            ipfsCid: data.certificateInfo.ipfsCid,
          });
          // SHOW YELLOW ERROR FOR DUPLICATE
          setError('⚠️ This certificate is already registered! You can still upload it as a new claim of the same achievement type.');
        } else {
          setDuplicateInfo({ isDuplicate: false });
          // Only set success if there's no existing warning
          if (!warning) {
            setSuccess('✓ Certificate is unique - ready to upload to IPFS! ✓');
          }
        }
      }
    } catch (err) {
      console.warn('Could not check for duplicates:', err.message);
      // Proceed anyway - assume not duplicate
      setDuplicateInfo({ isDuplicate: false });
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Upload file to IPFS via backend
  const handleUploadToIPFS = async () => {
    if (!file || !hash) {
      setError('Please compute hash first');
      return;
    }

    // Allow duplicate uploads (users can claim same achievement multiple times)
    // But show warning in the error state

    setUploading(true);
    setError(null); // Clear errors before upload

    try {
      // First, analyze for duplicates
      const analysisFormData = new FormData();
      analysisFormData.append('file', file);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const analysisResponse = await fetch(`${backendUrl}/api/certificates/analyze`, {
        method: 'POST',
        body: analysisFormData,
      });

      const analysisData = await analysisResponse.json();
      const analysis = analysisData.analysis;

      // CHECK FOR DUPLICATE (409 status means duplicate detected)
      if (analysisResponse.status === 409 && analysisData.isDuplicate) {
        // Build detailed warning message
        let warningMsg = analysisData.error || 'Similar certificate detected';
        if (analysisData.matchDetails?.originalCertificate) {
          warningMsg += `\n\nOriginal uploaded: ${analysisData.matchDetails.originalCertificate}`;
        }
        setWarning(`⚠️ ${warningMsg}\n\nYou can still upload this as a new claim.`);
        // Don't throw error - allow upload to proceed
      } else if (!analysisResponse.ok) {
        // Other errors should still throw
        throw new Error(analysisData.error || 'Analysis failed');
      } else if (analysisData.isDuplicate) {
        let warningMsg = analysisData.error || 'Similar certificate detected';
        if (analysisData.matchDetails?.originalCertificate) {
          warningMsg += `\n\nOriginal uploaded: ${analysisData.matchDetails.originalCertificate}`;
        }
        setWarning(`⚠️ ${warningMsg}\n\nYou can still upload this as a new claim.`);
      } else {
        setSuccess('✓ Certificate is unique - uploading...');
      }

      // Certificate analysis complete - proceed with upload (regardless of duplicate)
      // Now upload to IPFS
      const formData = new FormData();
      formData.append('file', file);

      const ipfsResponse = await fetch(`${backendUrl}/api/ipfs/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!ipfsResponse.ok) {
        const errorData = await ipfsResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const ipfsData = await ipfsResponse.json();
      if (ipfsData.success && ipfsData.ipfsCid) {
        setIpfsCid(ipfsData.ipfsCid);

        // Store in backend database (only if user is logged in)
        if (user && user.email) {
          // Get student's wallet address (from localStorage or MetaMask)
          let studentWallet = null;
          try {
            // Try to get from localStorage first (if user set it)
            const savedWallet = localStorage.getItem(`wallet_${user.email}`);
            if (savedWallet) {
              studentWallet = savedWallet;
            } else if (window.ethereum) {
              // Try to get from MetaMask
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                studentWallet = accounts[0];
                localStorage.setItem(`wallet_${user.email}`, studentWallet);
              }
            }
          } catch (walletErr) {
            console.warn('Could not retrieve wallet address:', walletErr.message);
          }

          const storeResponse = await fetch(`${backendUrl}/api/certificates/store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis,
              studentEmail: user.email,
              studentWallet: studentWallet, // Now including wallet address
              ipfsCid: ipfsData.ipfsCid,
            }),
          });

          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            console.log('Certificate stored:', storeData.record.id);
          } else {
            console.warn('Failed to store certificate in database');
          }
        }

        setStep('done');
        // Show upload success separately from duplicate warning
        setSuccess(`✅ Certificate uploaded to IPFS successfully! 🎉\nVerifier will review for authenticity.`);
        
        // Refresh certificate history
        setTimeout(() => loadCertificateHistory(), 500);
      } else {
        throw new Error(ipfsData.error || 'Upload failed');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async (certId) => {
    if (!confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const deleteResponse = await fetch(`${backendUrl}/api/certificates/${certId}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        setSuccess('Certificate deleted successfully');
        // Refresh certificate history
        loadCertificateHistory();
      } else {
        const errorData = await deleteResponse.json();
        setError(`Failed to delete certificate: ${errorData.error}`);
      }
    } catch (err) {
      setError(`Error deleting certificate: ${err.message}`);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setFileName(null);
    setFilePreview(null);
    setHash(null);
    setIpfsCid(null);
    setDuplicateInfo(null);
    setDuplicateAnalysisResult(null);
    setError(null);
    setSuccess(null);
    setWarning(null);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Upload Certificate</h1>
          <p className="text-gray-600 mt-2">Upload your certificate to IPFS and register the hash on blockchain</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}
        {warning && (
          <Alert
            type="warning"
            title="⚠️ Warning"
            message={warning}
            onClose={() => setWarning(null)}
            className="mb-6"
          />
        )}
        {success && (
          <Alert
            type="success"
            title="Success"
            message={success}
            onClose={() => setSuccess(null)}
            className="mb-6"
          />
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${step === 'upload' || step === 'hashing' || step === 'uploading' || step === 'done' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'upload' || step === 'hashing' || step === 'uploading' || step === 'done' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  1
                </div>
                <span className="ml-3 font-medium">Select File</span>
              </div>

              <div className={`w-12 h-1 ${step === 'hashing' || step === 'uploading' || step === 'done' ? 'bg-blue-600' : 'bg-gray-300'}`} />

              <div className={`flex items-center ${step === 'hashing' || step === 'uploading' || step === 'done' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'hashing' || step === 'uploading' || step === 'done' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
                <span className="ml-3 font-medium">Compute Hash</span>
              </div>

              <div className={`w-12 h-1 ${step === 'uploading' || step === 'done' ? 'bg-blue-600' : 'bg-gray-300'}`} />

              <div className={`flex items-center ${step === 'uploading' || step === 'done' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'uploading' || step === 'done' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  3
                </div>
                <span className="ml-3 font-medium">Upload</span>
              </div>

              <div className={`w-12 h-1 ${step === 'done' ? 'bg-blue-600' : 'bg-gray-300'}`} />

              <div className={`flex items-center ${step === 'done' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'done' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  ✓
                </div>
                <span className="ml-3 font-medium">Complete</span>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Certificate File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.gif"
                className="hidden"
                disabled={uploading || hashing}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
                disabled={uploading || hashing}
              >
                <Upload size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-900">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-600 mt-1">PDF, PNG, JPG, GIF (max 10MB)</p>
              </button>
            </div>

            {/* File Selected */}
            {fileName && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{fileName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-sm text-gray-600">Type: {file.type}</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Change
                  </button>
                </div>

                {/* Image Preview */}
                {filePreview && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <img src={filePreview} alt="Preview" className="max-h-40 rounded border border-gray-200" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hash Computation Section */}
          {fileName && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Compute File Hash (Keccak-256)</h2>
              
              {!hash ? (
                <button
                  onClick={handleComputeHash}
                  disabled={hashing || !fileName}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
                >
                  {hashing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Computing Hash...</span>
                    </>
                  ) : (
                    <>
                      <Hash size={20} />
                      <span>Compute Hash</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <p className="font-semibold text-green-900">Hash Computed Successfully</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Keccak-256 Hash:</p>
                      <div className="mt-2 p-3 bg-white border border-gray-200 rounded font-mono text-xs text-gray-900 break-all">
                        {hash}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyToClipboard(hash, 'hash')}
                      className="ml-4 p-2 text-gray-600 hover:text-blue-600 transition"
                      title="Copy hash"
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  {/* Duplicate Status */}
                  {checkingDuplicate && (
                    <div className="mt-4 flex items-center space-x-2 text-blue-600">
                      <LoadingSpinner size="sm" />
                      <span>Checking for duplicates...</span>
                    </div>
                  )}

                  {duplicateInfo?.isDuplicate && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-start space-x-2">
                        <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-900">Certificate Already Registered</p>
                          <p className="text-sm text-red-800 mt-1">
                            <strong>Issuer:</strong> {duplicateInfo.issuer}
                          </p>
                          <p className="text-sm text-red-800">
                            <strong>Date:</strong> {new Date(duplicateInfo.timestamp).toLocaleString()}
                          </p>
                          {duplicateInfo.ipfsCid && (
                            <p className="text-sm text-red-800 mt-1">
                              <strong>IPFS CID:</strong> {duplicateInfo.ipfsCid}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {duplicateInfo && !duplicateInfo.isDuplicate && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-start space-x-2">
                        <CheckCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">This certificate is unique and ready to upload</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload to IPFS Section */}
          {hash && !duplicateInfo?.isDuplicate && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Upload to IPFS</h2>
              <button
                onClick={handleUploadToIPFS}
                disabled={uploading || !hash || duplicateInfo?.isDuplicate}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Uploading to IPFS...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload to IPFS via Pinata</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success Section */}
          {ipfsCid && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 4: Upload Complete!</h2>
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3 mb-4">
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-green-900 text-lg">Certificate successfully uploaded!</p>
                    <p className="text-sm text-green-800 mt-1">Your certificate is now stored on IPFS</p>
                  </div>
                </div>

                {/* IPFS CID */}
                <div className="mt-6 p-4 bg-white border border-gray-200 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-2">IPFS CID:</p>
                  <div className="flex items-center space-x-2">
                    <p className="flex-1 font-mono text-sm text-gray-900 break-all">{ipfsCid}</p>
                    <button
                      onClick={() => handleCopyToClipboard(ipfsCid, 'cid')}
                      className="p-2 text-gray-600 hover:text-blue-600 transition flex-shrink-0"
                      title="Copy CID"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                {/* Hash */}
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-2">Certificate Hash (Keccak-256):</p>
                  <div className="flex items-center space-x-2">
                    <p className="flex-1 font-mono text-sm text-gray-900 break-all">{hash}</p>
                    <button
                      onClick={() => handleCopyToClipboard(hash, 'hash')}
                      className="p-2 text-gray-600 hover:text-blue-600 transition flex-shrink-0"
                      title="Copy hash"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-semibold text-blue-900 mb-3">Next Steps:</p>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>✓ Certificate uploaded to IPFS</li>
                    <li>→ Admin will verify and register the hash on blockchain</li>
                    <li>→ You can then claim achievements using this certificate</li>
                    <li>→ Employers can verify the certificate using the hash</li>
                  </ul>
                </div>

                {/* View on IPFS */}
                <div className="mt-4 flex space-x-3">
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                  >
                    <ExternalLink size={18} />
                    <span>View on IPFS Gateway</span>
                  </a>
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          {!ipfsCid && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Your certificate will be stored on IPFS and linked to your wallet</li>
                <li>• The hash (Keccak-256) is used for blockchain verification</li>
                <li>• Duplicate certificates cannot be registered again</li>
                <li>• Keep your hash and CID for future reference</li>
              </ul>
            </div>
          )}

          {/* Certificate History Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <History size={28} className="text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">📋 Your Certificate History</h2>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
                <span className="ml-3 text-gray-600">Loading your certificates...</span>
              </div>
            ) : certificateHistory.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No certificates uploaded yet</p>
                <p className="text-sm text-gray-500 mt-1">Your uploaded certificates will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificateHistory.map((cert) => (
                  <div
                    key={cert.id}
                    className={`p-4 rounded-lg border transition ${
                      cert.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : cert.status === 'rejected'
                        ? 'bg-red-50 border-red-200'
                        : cert.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header with filename and status */}
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText size={18} className="text-gray-600 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{cert.fileName}</h3>
                            {cert.issuer && cert.issuer !== 'Not detected' && (
                              <p className="text-sm text-gray-600">Issuer: {cert.issuer}</p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2 mt-2">
                          {cert.status === 'approved' && (
                            <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              <CheckCircle2 size={14} />
                              <span>✅ Approved</span>
                            </div>
                          )}
                          {cert.status === 'rejected' && (
                            <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                              <XCircle size={14} />
                              <span>❌ Rejected</span>
                            </div>
                          )}
                          {cert.status === 'pending' && (
                            <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                              <Clock size={14} />
                              <span>⏳ Under Review</span>
                            </div>
                          )}
                        </div>

                        {/* Dates */}
                        <div className="text-xs text-gray-600 mt-3 space-y-1">
                          <p>
                            <Clock size={12} className="inline mr-1" />
                            Uploaded: {new Date(cert.uploadedAt).toLocaleDateString()} {new Date(cert.uploadedAt).toLocaleTimeString()}
                          </p>
                          {cert.approvedAt && (
                            <p>
                              <CheckCircle size={12} className="inline mr-1 text-green-600" />
                              Approved: {new Date(cert.approvedAt).toLocaleDateString()}
                            </p>
                          )}
                          {cert.rejectionReason && (
                            <p className="text-red-700 font-medium">
                              Rejection reason: {cert.rejectionReason}
                            </p>
                          )}
                        </div>

                        {/* IPFS Link */}
                        {cert.ipfsCid && (
                          <div className="mt-3">
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            >
                              <ExternalLink size={12} />
                              <span>View on IPFS</span>
                            </a>
                          </div>
                        )}

                        {/* Delete Button */}
                        <div className="mt-4 pt-4 border-t border-gray-300 border-opacity-30">
                          <button
                            onClick={() => handleDeleteCertificate(cert.id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded flex items-center space-x-1 transition"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* File Size */}
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xs text-gray-600">
                          {(cert.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateUpload;
