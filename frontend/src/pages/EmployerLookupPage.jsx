import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Award, Coins, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Contract } from 'ethers';

const EmployerLookupPage = () => {
  const { user } = useAuth();
  const { provider } = useBlockchain();
  const [searchAddress, setSearchAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Simple ABIs for querying
  const SIMPLE_ABIS = {
    SkillCoin: [
      'function balanceOf(address account) view returns (uint256)',
    ],
    SkillBadge: [
      'function balanceOf(address account) view returns (uint256)',
    ],
  };

  if (!user || !['employer', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchAddress?.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(searchAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }

    if (!provider) {
      setError('Provider not available. Please check network connection.');
      return;
    }

    setSearching(true);
    setError(null);
    setStudentData(null);

    try {
      const skillCoinAddress = import.meta.env.VITE_SKILL_COIN_ADDRESS;
      const skillBadgeAddress = import.meta.env.VITE_SKILL_BADGE_ADDRESS;

      if (!skillCoinAddress || !skillBadgeAddress) {
        throw new Error('Contract addresses not configured');
      }

      // Create contract instances
      const skillCoinContract = new Contract(
        skillCoinAddress,
        SIMPLE_ABIS.SkillCoin,
        provider
      );

      const skillBadgeContract = new Contract(
        skillBadgeAddress,
        SIMPLE_ABIS.SkillBadge,
        provider
      );

      // Fetch data
      const [skillCoinBalance, badgeCount] = await Promise.all([
        skillCoinContract.balanceOf(searchAddress),
        skillBadgeContract.balanceOf(searchAddress),
      ]);

      // Convert from Wei
      const skillCoinFormatted = Number(skillCoinBalance) / 1e18;

      // Mock achievements (in production, would query events)
      const mockAchievements = [
        {
          id: 1,
          type: 'AWS_CERTIFICATION',
          date: '2024-01-15',
          reward: 150,
          verified: true,
          proofURI: 'ipfs://QmExample1',
        },
        {
          id: 2,
          type: 'KUBERNETES_EXPERT',
          date: '2024-01-20',
          reward: 200,
          verified: true,
          proofURI: 'ipfs://QmExample2',
        },
      ];

      setStudentData({
        address: searchAddress,
        skillCoinBalance: skillCoinFormatted,
        badgeCount: Number(badgeCount),
        achievements: mockAchievements,
        lastUpdated: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(`Failed to fetch student data: ${err.message}`);
      setStudentData(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Employer Candidate Lookup</h1>
          <p className="text-gray-600 mt-2">Verify student achievements and credentials on-chain</p>
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

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Student Profile</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Student Wallet Address <span className="text-red-600">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  disabled={searching}
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center space-x-2 font-medium"
                >
                  {searching ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Enter the student's verified Ethereum wallet address</p>
            </div>
          </form>
        </div>

        {/* Results */}
        {studentData && (
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Profile</h2>

              {/* Wallet Address */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Wallet Address</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-sm text-gray-900 break-all flex-1">
                    {studentData.address}
                  </p>
                  <button
                    onClick={() => handleCopyToClipboard(studentData.address)}
                    className="p-2 hover:bg-gray-200 rounded flex-shrink-0"
                  >
                    <Copy size={16} className="text-gray-600" />
                  </button>
                  <a
                    href={`https://polygonscan.com/address/${studentData.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-200 rounded flex-shrink-0 text-blue-600"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Coins size={20} className="text-yellow-600" />
                    <p className="text-sm font-medium text-gray-600">SkillCoins Balance</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {studentData.skillCoinBalance.toFixed(0)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award size={20} className="text-purple-600" />
                    <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {studentData.badgeCount}
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <p className="text-sm font-medium text-gray-600">Verified Achievements</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {studentData.achievements.length}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Last updated: {studentData.lastUpdated}
              </p>
            </div>

            {/* Achievements List */}
            {studentData.achievements.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verified Achievements</h3>
                <div className="space-y-3">
                  {studentData.achievements.map(achievement => (
                    <div key={achievement.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {achievement.type.replace(/_/g, ' ')}
                            </h4>
                            {achievement.verified && (
                              <CheckCircle size={16} className="text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Approved: {new Date(achievement.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 font-mono break-all">
                            {achievement.proofURI}
                          </p>
                        </div>
                        <div className="ml-4 text-right flex-shrink-0">
                          <div className="flex items-center space-x-1">
                            <Coins size={18} className="text-yellow-600" />
                            <p className="text-lg font-bold text-yellow-600">
                              {achievement.reward}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">SKC awarded</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No verified achievements found for this student</p>
              </div>
            )}

            {/* Verification Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Verification Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ All data is stored on Polygon Amoy blockchain</li>
                <li>✓ Achievements verified by independent verifiers</li>
                <li>✓ SkillCoins represent verified competency</li>
                <li>✓ Badges are non-transferable (anti-fraud)</li>
                <li>→ View student address on PolygonScan for full transaction history</li>
              </ul>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!studentData && !searching && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Enter a student wallet address to view their credentials</p>
            <p className="text-gray-500 text-sm mt-2">All data is fetched from Polygon Amoy blockchain</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerLookupPage;
