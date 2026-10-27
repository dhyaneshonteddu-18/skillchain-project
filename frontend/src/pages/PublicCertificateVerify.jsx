
import React, { useState } from 'react';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Hash,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Contract, JsonRpcProvider } from 'ethers';

// Public read-only connection to Polygon Amoy.
// MetaMask is not required for certificate verification.
const publicProvider = new JsonRpcProvider(
  import.meta.env.VITE_POLYGON_AMOY_RPC_URL ||
    'https://polygon-amoy-bor-rpc.publicnode.com'
);

const CERTIFICATE_ABI = [
  'function getCertificateRecord(bytes32 certificateHash) view returns (bool issued, string memory issuer, uint64 registeredAt)',
  'function verifyCertificate(bytes32 certificateHash) view returns (bool)'
];

const PublicCertificateVerify = () => {
  const [certificateHash, setCertificateHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy. Please select and copy the text manually.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const hash = certificateHash.trim();

    if (!hash) {
      setError('Please enter a certificate hash.');
      setResult(null);
      return;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      setError(
        'Invalid hash format. Enter 0x followed by 64 hexadecimal characters.'
      );
      setResult(null);
      return;
    }

    const registryAddress =
      import.meta.env.VITE_CERTIFICATE_HASH_REGISTRY_ADDRESS;

    if (!registryAddress) {
      setError(
        'Certificate Registry address is missing. Check your frontend .env configuration.'
      );
      setResult(null);
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      // Ensure the RPC is reachable and points to Polygon Amoy.
      const network = await publicProvider.getNetwork();

      if (Number(network.chainId) !== 80002) {
        throw new Error(
          `Wrong blockchain network. Expected Polygon Amoy (80002), received chain ID ${network.chainId}.`
        );
      }

      const certificateContract = new Contract(
        registryAddress,
        CERTIFICATE_ABI,
        publicProvider
      );

      const isVerified =
        await certificateContract.verifyCertificate(hash);

      if (isVerified) {
        const [issued, issuer, registeredAt] =
          await certificateContract.getCertificateRecord(hash);

        if (!issued) {
          setResult({ verified: false, hash });
        } else {
          setResult({
            verified: true,
            hash,
            issuer,
            registeredDate: new Date(
              Number(registeredAt) * 1000
            ).toLocaleString()
          });
        }
      } else {
        setResult({ verified: false, hash });
      }
    } catch (err) {
      console.error('Certificate verification error:', err);

      setError(
        `Verification failed: ${
          err.shortMessage || err.message || 'Unable to contact the blockchain.'
        }`
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setCertificateHash('');
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const explorerUrl =
    'https://amoy.polygonscan.com/address/' +
    (import.meta.env.VITE_CERTIFICATE_HASH_REGISTRY_ADDRESS || '');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Verify Certificate
          </h1>
          <p className="text-gray-600 mt-2">
            Check whether a certificate hash is registered on the Polygon
            Amoy blockchain. No wallet connection is required.
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            title="Verification Error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Certificate Hash Verification
          </h2>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Certificate Hash (Keccak-256)
                <span className="text-red-600"> *</span>
              </label>

              <input
                type="text"
                value={certificateHash}
                onChange={(e) => setCertificateHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                disabled={verifying}
              />

              <p className="text-xs text-gray-600 mt-2">
                Enter the 66-character hash, including the 0x prefix.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2 font-medium"
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Hash size={20} />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="space-y-6">
            {result.verified ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <CheckCircle
                    size={32}
                    className="text-green-600 flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-green-900">
                      Certificate Hash Found
                    </h3>
                    <p className="text-sm text-green-800 mt-1">
                      This hash is registered in the CertificateHashRegistry
                      contract.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mt-6 pt-6 border-t border-green-200">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Certificate Hash
                    </p>
                    <div className="flex items-start space-x-2">
                      <p className="flex-1 font-mono text-sm break-all bg-white p-3 rounded border border-green-200">
                        {result.hash}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(result.hash)}
                        className="p-2 hover:bg-green-100 rounded"
                        title="Copy hash"
                      >
                        {copied ? 'Copied' : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Registered Issuer
                    </p>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border border-green-200 break-words">
                      {result.issuer}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Registration Date
                    </p>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border border-green-200">
                      {result.registeredDate}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-100 rounded border border-green-300">
                  <p className="text-sm text-green-900 font-semibold mb-2">
                    Polygon Amoy Testnet
                  </p>
                  <p className="text-xs text-green-800 mb-3">
                    The hash is registered on-chain. This confirms a record
                    exists, but does not independently prove that the issuer
                    is genuine or that the certificate is authentic.
                  </p>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-green-700 hover:text-green-800 font-medium"
                  >
                    <span>View Registry Contract on PolygonScan</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <AlertCircle
                    size={32}
                    className="text-red-600 flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-red-900">
                      Certificate Hash Not Found
                    </h3>
                    <p className="text-sm text-red-800 mt-1">
                      This hash was not found in the configured registry on
                      Polygon Amoy.
                    </p>
                  </div>
                </div>

                <p className="mt-4 font-mono text-sm break-all bg-white p-3 rounded border border-red-200">
                  {result.hash}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Verify Another Certificate
            </button>
          </div>
        )}

        {!result && !verifying && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
            <Hash size={48} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How Certificate Verification Works
            </h3>
            <div className="max-w-md mx-auto text-sm text-gray-700 space-y-3 mt-6 text-left">
              <p>1. Enter the certificate's Keccak-256 hash.</p>
              <p>2. The app queries CertificateHashRegistry on Polygon Amoy.</p>
              <p>3. The page displays the registration record if it exists.</p>
              <p>4. Employers can inspect the record and independently check the issuer.</p>
            </div>
          </div>
        )}

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            About Certificate Verification
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Public access without a wallet connection</li>
            <li>✓ Read-only queries to Polygon Amoy</li>
            <li>✓ Hash matching helps detect file changes</li>
            <li>✓ Issuer authenticity must be verified independently</li>
            <li>✓ Registry transactions can be inspected on PolygonScan</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PublicCertificateVerify;

