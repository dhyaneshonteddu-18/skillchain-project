import React, { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, AlertCircle, Copy, ExternalLink, Send, Hash, Zap, Award } from 'lucide-react';
import { Contract } from 'ethers';
import { getGasPriceOverrides, formatGasPrice } from '../utils/gasPrice';

const ApproveAchievement = () => {
  const { user } = useAuth();
  const { signer, accounts } = useBlockchain();
  const [step, setStep] = useState('form'); // form, confirming, processing, done
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [approvalResult, setApprovalResult] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    studentAddress: '',
    achievementType: '',
    proofURI: '',
    certificateHash: '',
    usesCertificate: false,
  });

  // Achievement types (must match deployed contract: AchievementRegistry)
  // Contract supports only these 3 types in rewardAmount mapping
  const ACHIEVEMENT_TYPES = [
    'INTERNSHIP',    // 100 SKC
    'HACKATHON',     // 200 SKC
    'AWS_CERT',      // 150 SKC
  ];

  // Reward amounts (must match contract constructor)
  const REWARD_AMOUNTS = {
    'INTERNSHIP': 100,
    'HACKATHON': 200,
    'AWS_CERT': 150,
  };

  if (!user || !['verifier', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.studentAddress?.trim()) {
      setError('Please enter student wallet address');
      return false;
    }

    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.studentAddress)) {
      setError('Invalid Ethereum address format');
      return false;
    }

    if (!formData.achievementType) {
      setError('Please select an achievement type');
      return false;
    }

    if (!formData.proofURI?.trim()) {
      setError('Please provide a proof URI');
      return false;
    }

    if (formData.usesCertificate && !formData.certificateHash?.trim()) {
      setError('Please provide certificate hash');
      return false;
    }

    if (formData.usesCertificate && !/^0x[a-fA-F0-9]{64}$/.test(formData.certificateHash)) {
      setError('Invalid certificate hash format (must be 0x... 64 hex chars)');
      return false;
    }

    return true;
  };

  // Submit approval
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStep('confirming');
    setError(null);
    setSuccess(null);
  };

  // Confirm and execute transaction
  const handleConfirmApproval = async () => {
    if (!signer || !accounts?.[0]) {
      setError('Wallet not connected. Please connect MetaMask first.');
      setStep('form');
      return;
    }

    setStep('processing');
    try {
      const certificateRegistryAddress = import.meta.env.VITE_CERTIFICATE_HASH_REGISTRY_ADDRESS;
      const achievementRegistryAddress = import.meta.env.VITE_ACHIEVEMENT_REGISTRY_ADDRESS;
      
      if (!certificateRegistryAddress || !achievementRegistryAddress) {
        throw new Error('Contract addresses not configured in .env');
      }

      // 1. Check if certificate hash exists (matches registered hash)
      try {
        const certContract = new Contract(
          certificateRegistryAddress,
          ['function verifyCertificate(bytes32) view returns (bool)'],
          signer
        );

        const isRegistered = await certContract.verifyCertificate(formData.certificateHash);
        if (!isRegistered) {
          throw new Error('❌ Certificate hash not found - must be registered by admin first');
        }
      } catch (err) {
        if (err.message.includes('not found')) {
          throw err;
        }
        throw new Error(`Hash verification error: ${err.message}`);
      }

      // 2. Approve achievement on blockchain
      try {
        const achievementContract = new Contract(
          achievementRegistryAddress,
          [
            'function approveAchievementWithHash(address, string, string, bytes32) external'
          ],
          signer
        );
        const gasPrices = await getGasPriceOverrides();
        const tx = await achievementContract.approveAchievementWithHash(
          formData.studentAddress,
          formData.achievementType,
          formData.proofURI,
          formData.certificateHash,
          gasPrices  // Add EIP-1559 fee overrides
        );

        const receipt = await tx.wait();
        
        setTxHash(receipt.hash);
        setApprovalResult({
          studentAddress: formData.studentAddress,
          achievementType: formData.achievementType,
          reward: REWARD_AMOUNTS[formData.achievementType] || 0,
          badgeId: 'Minted',
          proofURI: formData.proofURI,
          certificateHash: formData.certificateHash,
          timestamp: new Date().toISOString(),
        });

        setStep('done');
        setSuccess('✅ Success! Hash verified + achievement recorded + SKC awarded!');
      } catch (err) {
        throw err;
      }
    } catch (err) {
      setError(`Failed: ${err.message}`);
      setStep('form');
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      studentAddress: '',
      achievementType: '',
      proofURI: '',
      certificateHash: '',
      usesCertificate: false,
    });
    setTxHash(null);
    setApprovalResult(null);
    setError(null);
    setSuccess(null);
    setStep('form');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Approve Achievement</h1>
          <p className="text-gray-600 mt-2">Award SKC rewards and mint achievement badges</p>
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
        {success && (
          <Alert
            type="success"
            title="Success"
            message={success}
            onClose={() => setSuccess(null)}
            className="mb-6"
          />
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Form Step */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Student Wallet Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="studentAddress"
                  value={formData.studentAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">Enter the student's Ethereum wallet address</p>
              </div>

              {/* Achievement Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Achievement Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="achievementType"
                  value={formData.achievementType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an achievement type...</option>
                  {ACHIEVEMENT_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')} ({REWARD_AMOUNTS[type]} SKC)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.achievementType && (
                    <>Reward: <strong>{REWARD_AMOUNTS[formData.achievementType]} SKC</strong></>
                  )}
                </p>
              </div>

              {/* Proof URI */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Proof URI <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="proofURI"
                  value={formData.proofURI}
                  onChange={handleInputChange}
                  placeholder="ipfs://Qm... or https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">Link to certificate, diploma, or proof document (IPFS CID or URL)</p>
              </div>

              {/* Certificate Hash Option */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    name="usesCertificate"
                    checked={formData.usesCertificate}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <label className="text-sm font-semibold text-gray-900">
                    Link to Registered Certificate
                  </label>
                </div>

                {formData.usesCertificate && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Certificate Hash (Keccak-256) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="certificateHash"
                      value={formData.certificateHash}
                      onChange={handleInputChange}
                      placeholder="0x..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">Must be registered in CertificateHashRegistry contract</p>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 flex items-center space-x-2 mb-2">
                  <AlertCircle size={18} />
                  <span>Verifier Checklist</span>
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>✓ Certificate hash must be registered (admin approved)</li>
                  <li>✓ System will verify hash matches registered hash</li>
                  <li>✓ Students can claim multiple achievements of the same type</li>
                  <li>✓ Achievement type must be valid</li>
                  <li>✓ Proof URI must be valid link/IPFS CID</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 font-medium"
                >
                  <Award size={20} />
                  <span>Review & Approve</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Clear
                </button>
              </div>
            </form>
          )}

          {/* Confirmation Step */}
          {step === 'confirming' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review Approval Details</h2>

              {/* Summary Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student Address</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 break-all mt-1">
                      {formData.studentAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Achievement Type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formData.achievementType.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">SKC Reward</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Zap size={16} className="text-yellow-600" />
                      <p className="text-lg font-bold text-yellow-600">
                        {REWARD_AMOUNTS[formData.achievementType] || 0} SKC
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Badge</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      Will be minted
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Proof URI</p>
                    <p className="text-sm font-mono text-gray-900 break-all mt-1 bg-white p-2 rounded border border-gray-200">
                      {formData.proofURI}
                    </p>
                  </div>

                  {formData.usesCertificate && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Certificate Hash</p>
                      <p className="text-sm font-mono text-gray-900 break-all mt-1 bg-white p-2 rounded border border-gray-200">
                        {formData.certificateHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation Checklist */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-3">Verify these checks will pass:</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" required />
                    <span className="text-sm text-gray-700">Certificate hash is registered on blockchain</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" required />
                    <span className="text-sm text-gray-700">Hash will be verified against registered hash</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" required />
                    <span className="text-sm text-gray-700">Student can claim multiple achievements of the same type</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t">
                <button
                  onClick={handleConfirmApproval}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 font-medium"
                >
                  <CheckCircle size={20} />
                  <span>Confirm & Execute</span>
                </button>
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="lg" message="Processing achievement approval..." />
              <p className="text-gray-600 text-center max-w-md mt-4">
                Executing blockchain transaction on Polygon Amoy...
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'done' && approvalResult && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Achievement Approved! 🎉</h2>
              </div>

              {/* Results Card */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Student Address</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-sm font-mono text-gray-900 truncate">
                        {approvalResult.studentAddress}
                      </p>
                      <button
                        onClick={() => handleCopyToClipboard(approvalResult.studentAddress)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievement Type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      {approvalResult.achievementType.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">SKC Awarded</p>
                    <div className="flex items-center space-x-1 mt-2">
                      <Zap size={16} className="text-yellow-600" />
                      <p className="text-lg font-bold text-yellow-600">
                        {approvalResult.reward} SKC
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Badge Token ID</p>
                    <p className="text-sm font-mono font-semibold text-gray-900 mt-2">
                      #{approvalResult.badgeId}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600">Transaction Hash</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-sm font-mono text-gray-900 truncate">
                        {txHash}
                      </p>
                      <button
                        onClick={() => handleCopyToClipboard(txHash)}
                        className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                      >
                        <Copy size={16} className="text-gray-600" />
                      </button>
                      <a
                        href={`https://polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-200 rounded flex-shrink-0 text-blue-600"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>

                  {formData.usesCertificate && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-600">Certificate Hash</p>
                      <p className="text-sm font-mono text-gray-900 break-all mt-2 bg-white p-2 rounded border border-gray-200">
                        {approvalResult.certificateHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">What Happened:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Certificate hash verified against registered hash</li>
                  <li>✓ Achievement recorded on blockchain (multiple claims allowed)</li>
                  <li>✓ {approvalResult.reward} SKC transferred to student wallet</li>
                  <li>✓ Badge NFT minted (non-transferable)</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t">
                <a
                  href={`https://polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 font-medium"
                >
                  <ExternalLink size={20} />
                  <span>View on PolygonScan</span>
                </a>
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Approve Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApproveAchievement;
