import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { Search, Award, Coins, TrendingUp } from 'lucide-react';
import { formatAddress } from '../utils/formatting';

const EmployerLookup = () => {
  const { user } = useAuth();
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);

  const mockStudentData = {
    '0x1234567890123456789012345678901234567890': {
      name: 'John Doe',
      email: 'john@example.com',
      joinedDate: '2024-01-01',
      skillCoinBalance: 450,
      totalEarnings: 750,
      achievements: [
        { id: 1, type: 'AWS Solutions Architect', issuer: 'AWS Academy', date: '2024-01-15', proofURI: 'ipfs://QmExample1' },
        { id: 2, type: 'React Fundamentals', issuer: 'Udacity', date: '2024-01-10', proofURI: 'ipfs://QmExample2' },
        { id: 3, type: 'Kubernetes Certification', issuer: 'Linux Foundation', date: '2024-01-20', proofURI: 'ipfs://QmExample3' }
      ],
      badges: [
        { id: 1, type: 'Cloud Computing', earnedDate: '2024-01-15' },
        { id: 2, type: 'Frontend Development', earnedDate: '2024-01-10' }
      ]
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchAddress) {
      setError('Please enter a wallet address');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = mockStudentData[searchAddress.toLowerCase()];
      if (data) {
        setStudentData(data);
      } else {
        setError('No student record found for this wallet address');
        setStudentData(null);
      }
    } catch (err) {
      setError('Failed to lookup student information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Employer Lookup</h1>
          <p className="text-gray-600 mt-2">Verify student achievements and skills using their wallet address</p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Wallet Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="0x1234567890123456789012345678901234567890"
                  className="flex-1 form-input font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Search size={18} />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Demo Address Hint */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            💡 <strong>Demo:</strong> Try: <code className="bg-white px-2 py-1 rounded">0x1234567890123456789012345678901234567890</code>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}

        {/* Loading */}
        {loading && (
          <div className="card text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Searching student records...</p>
          </div>
        )}

        {/* Results */}
        {studentData && !loading && (
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{studentData.name}</h2>
                  <p className="text-gray-600 mt-1">{studentData.email}</p>
                  <p className="text-sm text-gray-500 mt-2">Member since {new Date(studentData.joinedDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-600">{studentData.skillCoinBalance} SKC</div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Achievements</p>
                      <p className="text-2xl font-bold text-gray-900">{studentData.achievements.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Badges Earned</p>
                      <p className="text-2xl font-bold text-gray-900">{studentData.badges.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Earned</p>
                      <p className="text-2xl font-bold text-gray-900">{studentData.totalEarnings} SKC</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Verified Achievements</h3>
              <div className="space-y-4">
                {studentData.achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{achievement.type}</h4>
                        <p className="text-sm text-gray-600 mt-1">Issued by: {achievement.issuer}</p>
                        <p className="text-xs text-gray-500 mt-2">Verified on {new Date(achievement.date).toLocaleDateString()}</p>
                        <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          ✓ Verified
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <a
                          href={`https://ipfs.io/ipfs/${achievement.proofURI.replace('ipfs://', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          View Proof →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Earned Badges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentData.badges.map((badge) => (
                  <div key={badge.id} className="p-4 border border-gray-200 rounded-lg text-center hover:border-gray-300 transition">
                    <div className="text-3xl mb-2">🏆</div>
                    <h4 className="font-semibold text-gray-900">{badge.type}</h4>
                    <p className="text-xs text-gray-500 mt-2">Earned {new Date(badge.earnedDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✓ Verification Complete</h4>
              <p className="text-sm text-green-800">
                All achievements shown above are verified on the blockchain and maintained by SkillChain. 
                Each achievement has been independently reviewed by an authorized verifier.
              </p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!studentData && !loading && !error && (
          <div className="card text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Enter a student's wallet address to view their achievements and skills</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerLookup;
