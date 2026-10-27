import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { Award, Coins, BookOpen, BarChart3, Upload, TrendingUp, ExternalLink } from 'lucide-react';
import { Contract } from 'ethers';

const Dashboard = () => {
  const { user, wallet, walletConnected, loading: authLoading } = useAuth();
  const { provider, accounts, networkError } = useBlockchain();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    skillCoinBalance: 0,
    badgeCount: 0,
    achievements: [],
    bounties: [],
  });

  // Redirect verifiers to their own dashboard
  if (user && ['verifier', 'admin'].includes(user.role)) {
    return <Navigate to="/verifier-dashboard" />;
  }

  // Simple ABI for reading contract data
  const SIMPLE_ABIS = {
    SkillCoin: [
      'function balanceOf(address account) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ],
    SkillBadge: [
      'function balanceOf(address account) view returns (uint256)',
    ],
  };

  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (!walletConnected || !wallet || !provider) {
        setData({
          skillCoinBalance: 0,
          badgeCount: 0,
          achievements: [],
          bounties: [],
        });
        setLoading(false);
        return;
      }

      try {
        const skillCoinAddress = import.meta.env.VITE_SKILL_COIN_ADDRESS;
        const skillBadgeAddress = import.meta.env.VITE_SKILL_BADGE_ADDRESS;
        const achievementRegistryAddress = import.meta.env.VITE_ACHIEVEMENT_REGISTRY_ADDRESS;

        if (!skillCoinAddress || !skillBadgeAddress || !achievementRegistryAddress) {
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

        const achievementRegistryContract = new Contract(
          achievementRegistryAddress,
          ['function claimCount(address student, string achievementType_) view returns (uint256)'],
          provider
        );

        // Fetch balances in parallel
        const [skillCoinBalance, badgeCount] = await Promise.all([
          skillCoinContract.balanceOf(wallet),
          skillBadgeContract.balanceOf(wallet),
        ]);

        // Convert from Wei to tokens (18 decimals)
        const skillCoinFormatted = Number(skillCoinBalance) / 1e18;
        const badgeCountNum = Number(badgeCount);

        // Fetch achievement counts for major types
        const achievementTypes = ['INTERNSHIP', 'HACKATHON', 'AWS_CERT'];
        let totalAchievements = 0;

        try {
          for (const type of achievementTypes) {
            const count = await achievementRegistryContract.claimCount(wallet, type);
            totalAchievements += Number(count);
          }
        } catch (e) {
          console.log('Could not fetch claimCount:', e.message);
        }

        setData({
          skillCoinBalance: skillCoinFormatted,
          badgeCount: badgeCountNum,
          achievements: totalAchievements > 0 ? Array(totalAchievements).fill(null).map((_, i) => ({ id: i })) : [],
          bounties: [],
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching blockchain data:', err);
        setError(`Failed to load blockchain data: ${err.message}`);
        setData({
          skillCoinBalance: 0,
          badgeCount: 0,
          achievements: [],
          bounties: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchainData();
  }, [walletConnected, wallet, provider]);

  if (authLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.fullName || user.email.split('@')[0]}!</h1>
          <p className="text-gray-600 mt-2">Track your progress and achievements on SkillChain</p>
        </div>

        {/* Wallet Connection Status */}
        {!walletConnected && user && (
          <Alert
            type="warning"
            title="Wallet Not Connected"
            message="Click 'Connect Wallet' button to link MetaMask and view real blockchain data"
            onClose={() => {}}
            className="mb-6"
          />
        )}

        {walletConnected && wallet && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ Connected to MetaMask</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono text-green-800">{wallet}</p>
              <a
                href={`https://polygonscan.com/address/${wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
              >
                <span>View on PolygonScan</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <Alert
            type="warning"
            title="Note"
            message="Contracts may not be available. You can still use IPFS upload and other features."
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Achievements Card */}
          <div className="card hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Achievements</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{data.achievements.length}</p>
                <p className="text-xs text-gray-500 mt-1">Verified & approved</p>
              </div>
              <Award size={40} className="text-blue-200" />
            </div>
          </div>

          {/* SkillCoins Card */}
          <div className="card hover:shadow-lg transition bg-gradient-to-br from-yellow-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">SkillCoins Earned</p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-4xl font-bold text-yellow-600">
                    {loading ? '...' : data.skillCoinBalance.toFixed(0)}
                  </p>
                  {!loading && data.skillCoinBalance > 0 && (
                    <TrendingUp size={24} className="text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {walletConnected ? 'From blockchain' : 'Connect wallet to load'}
                </p>
              </div>
              <Coins size={40} className="text-yellow-200" />
            </div>
          </div>

          {/* Badges Card */}
          <div className="card hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Badges Earned</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {loading ? '...' : data.badgeCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">NFT achievement badges</p>
              </div>
              <BookOpen size={40} className="text-purple-200" />
            </div>
          </div>

          {/* Bounties Card */}
          <div className="card hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Bounties Completed</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{data.bounties.length}</p>
                <p className="text-xs text-gray-500 mt-1">Verified & paid</p>
              </div>
              <BarChart3 size={40} className="text-green-200" />
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        {walletConnected && wallet && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Connected Wallet</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono text-blue-800">{wallet}</p>
              <a
                href={`https://polygonscan.com/address/${wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <span>View on PolygonScan</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {user.role === 'student' && (
              <>
                <Link
                  to="/upload-certificate"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Upload size={16} />
                  <span>Upload Certificate</span>
                </Link>
                <Link
                  to="/achievements"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  View My Achievements
                </Link>
                <Link
                  to="/bounties"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                >
                  Browse Bounties
                </Link>
              </>
            )}

            {user.role === 'verifier' && (
              <>
                <Link
                  to="/approve-achievement"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  Approve Achievement
                </Link>
                <Link
                  to="/verifier"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Verifier Panel
                </Link>
                <Link
                  to="/bounties"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                >
                  Review Bounties
                </Link>
              </>
            )}

            {user.role === 'employer' && (
              <>
                <Link
                  to="/employer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Search Candidates
                </Link>
                <Link
                  to="/bounties"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  Create Bounty
                </Link>
                <Link
                  to="/verify-certificate"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                >
                  Verify Certificate
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How It Works */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex space-x-3">
                <span className="font-bold text-blue-600 flex-shrink-0">1</span>
                <span>Upload your certificates to IPFS</span>
              </li>
              <li className="flex space-x-3">
                <span className="font-bold text-blue-600 flex-shrink-0">2</span>
                <span>Verifiers review and approve achievements</span>
              </li>
              <li className="flex space-x-3">
                <span className="font-bold text-blue-600 flex-shrink-0">3</span>
                <span>Earn SkillCoins (SKC) rewards</span>
              </li>
              <li className="flex space-x-3">
                <span className="font-bold text-blue-600 flex-shrink-0">4</span>
                <span>Receive non-transferable achievement badges</span>
              </li>
              <li className="flex space-x-3">
                <span className="font-bold text-blue-600 flex-shrink-0">5</span>
                <span>Employers verify your credentials on-chain</span>
              </li>
            </ol>
          </div>

          {/* Blockchain Info */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Blockchain Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="font-semibold">Polygon Amoy (Testnet)</span>
              </div>
              <div className="flex justify-between">
                <span>Chain ID:</span>
                <span className="font-mono font-semibold">80002</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-semibold ${walletConnected ? 'text-green-600' : 'text-gray-600'}`}>
                  {walletConnected ? '✓ Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-gray-600">
                  All data is stored on-chain and verified by smart contracts. Your privacy is protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
