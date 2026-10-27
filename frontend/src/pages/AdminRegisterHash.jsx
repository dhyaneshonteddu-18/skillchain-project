import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { Navigate } from 'react-router-dom';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, Copy, ExternalLink, Hash } from 'lucide-react';
import { Contract } from 'ethers';
import { getGasPriceOverrides, formatGasPrice } from '../utils/gasPrice';

const AdminRegisterHash = () => {
  const { user } = useAuth();
  const { signer, accounts } = useBlockchain();
  const [step, setStep] = useState('form'); // form, processing, done
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const [formData, setFormData] = useState({
    certificateHash: '',
    issuerName: '',
  });

  // Any logged-in user can try, but contract will enforce admin permissions
  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.certificateHash?.trim()) {
      setError('Please enter certificate hash');
      return false;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(formData.certificateHash)) {
      setError('Invalid hash format (must be 0x + 64 hex characters)');
      return false;
    }

    if (!formData.issuerName?.trim()) {
      setError('Please enter issuer name');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!signer || !accounts?.[0]) {
      setError('Wallet not connected. Please connect MetaMask first.');
      return;
    }

    setStep('processing');
    setError(null);
    setSuccess(null);

    try {
      const certificateRegistryAddress = import.meta.env.VITE_CERTIFICATE_HASH_REGISTRY_ADDRESS;
      
      if (!certificateRegistryAddress) {
        throw new Error('Certificate Registry contract address not configured');
      }

      const certificateABI = [
        'function registerCertificate(bytes32 certificateHash, string issuer) external',
        'function verifyCertificate(bytes32 certificateHash) view returns (bool)',
      ];

      const certificateContract = new Contract(
        certificateRegistryAddress,
        certificateABI,
        signer
      );

      // Check if already registered
      try {
        const isRegistered = await certificateContract.verifyCertificate(formData.certificateHash);
        if (isRegistered) {
          throw new Error('This certificate hash is already registered');
        }
      } catch (err) {
        if (err.message.includes('already registered')) throw err;
        // Continue if contract doesn't exist or other error
      }

      // Register the hash
      const tx = await certificateContract.registerCertificate(
        formData.certificateHash,
        formData.issuerName,
        await getGasPriceOverrides()  // Add EIP-1559 fee overrides
      );

      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStep('done');
      setSuccess('✅ Certificate hash registered successfully!');
    } catch (err) {
      setError(`Failed to register: ${err.message}`);
      setStep('form');
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFormData({
      certificateHash: '',
      issuerName: '',
    });
    setTxHash(null);
    setError(null);
    setSuccess(null);
    setStep('form');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Register Certificate Hash</h1>
          <p className="text-gray-600 mt-2">Admin: Register a certificate hash on the blockchain</p>
        </div>

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

        <div className="bg-white rounded-lg shadow-md p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">Must be 0x + 64 hexadecimal characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Issuer Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="issuerName"
                  value={formData.issuerName}
                  onChange={handleInputChange}
                  placeholder="e.g., Stanford University"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">Name of the institution issuing the certificate</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> This registers the certificate hash on the blockchain. Students will then be able to claim achievements using this certificate.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 font-medium"
              >
                <Hash size={20} />
                <span>Register Hash</span>
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="lg" message="Registering hash on blockchain..." />
            </div>
          )}

          {step === 'done' && txHash && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Hash Registered! ✓</h2>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Certificate Hash</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-sm font-mono text-gray-900 break-all flex-1 bg-white p-2 rounded border border-gray-200">
                      {formData.certificateHash}
                    </p>
                    <button
                      onClick={() => handleCopyToClipboard(formData.certificateHash)}
                      className="p-2 hover:bg-gray-100 rounded flex-shrink-0"
                    >
                      <Copy size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Issuer</p>
                  <p className="text-sm text-gray-900 mt-2 bg-white p-2 rounded border border-gray-200">
                    {formData.issuerName}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Transaction Hash</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-sm font-mono text-gray-900 truncate flex-1 bg-white p-2 rounded border border-gray-200">
                      {txHash}
                    </p>
                    <button
                      onClick={() => handleCopyToClipboard(txHash)}
                      className="p-2 hover:bg-gray-100 rounded flex-shrink-0"
                    >
                      <Copy size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-3">
                  The certificate hash is now registered on Polygon Amoy. Students can now use this certificate to claim achievements.
                </p>
                <a
                  href={`https://polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <span>View on PolygonScan</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="flex space-x-3 pt-6 border-t">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Register Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterHash;
