import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { CheckCircle, X, FileText, Hash, Eye, Download } from 'lucide-react';

const VerifierPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('achievements');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [verifyingHash, setVerifyingHash] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hashInput, setHashInput] = useState('');
  const [issuerInput, setIssuerInput] = useState('');

  if (!user || !['verifier', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  // Mock data
  const pendingAchievements = [
    {
      id: 1,
      studentName: 'John Doe',
      studentEmail: 'john@example.com',
      achievementType: 'AWS Solutions Architect',
      submittedDate: '2024-01-20',
      proofURI: 'ipfs://QmExample1',
      certificateHash: '0x' + 'a'.repeat(64)
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      studentEmail: 'jane@example.com',
      achievementType: 'Kubernetes Certification',
      submittedDate: '2024-01-19',
      proofURI: 'ipfs://QmExample2',
      certificateHash: '0x' + 'b'.repeat(64)
    }
  ];

  const registeredCertificates = [
    {
      id: 1,
      hash: '0x' + 'c'.repeat(64),
      issuer: 'AWS Academy',
      registeredDate: '2024-01-10',
      verified: true
    },
    {
      id: 2,
      hash: '0x' + 'd'.repeat(64),
      issuer: 'Linux Foundation',
      registeredDate: '2024-01-15',
      verified: true
    }
  ];

  const handleApproveAchievement = (achievement) => {
    setSuccess(`Achievement by ${achievement.studentName} approved! 150 SKC awarded.`);
    setSelectedAchievement(null);
  };

  const handleRejectAchievement = (achievement) => {
    setSuccess(`Achievement by ${achievement.studentName} rejected.`);
    setSelectedAchievement(null);
  };

  const handleRegisterHash = async () => {
    if (!hashInput || !issuerInput) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Simulated API call
      setSuccess('Certificate hash registered successfully on blockchain!');
      setHashInput('');
      setIssuerInput('');
    } catch (err) {
      setError('Failed to register certificate hash');
    }
  };

  const handleVerifyHash = async (hash) => {
    try {
      setVerifyingHash(hash);
      // Simulated verification
      setSuccess('Certificate verified! Hash matches registered record.');
      setTimeout(() => setVerifyingHash(null), 1000);
    } catch (err) {
      setError('Certificate verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Verifier Panel</h1>
          <p className="text-gray-600 mt-2">Review achievements and manage certificate registrations</p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'achievements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Achievements ({pendingAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'certificates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Certificate Registry
          </button>
        </div>

        {/* Achievement Review Tab */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {pendingAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    onClick={() => setSelectedAchievement(achievement)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedAchievement?.id === achievement.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{achievement.studentName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{achievement.achievementType}</p>
                    <p className="text-xs text-gray-500 mt-2">{achievement.submittedDate}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              {selectedAchievement ? (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievement Details</h2>

                  <div className="space-y-4">
                    {/* Student Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student Name</label>
                      <p className="mt-1 text-gray-900">{selectedAchievement.studentName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{selectedAchievement.studentEmail}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Achievement Type</label>
                      <p className="mt-1 text-gray-900 font-semibold">{selectedAchievement.achievementType}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Proof URI</label>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-gray-600 break-all">
                        {selectedAchievement.proofURI}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Certificate Hash</label>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-gray-600 break-all font-mono">
                        {selectedAchievement.certificateHash}
                      </div>
                      <button
                        onClick={() => handleVerifyHash(selectedAchievement.certificateHash)}
                        className="mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition flex items-center space-x-2"
                      >
                        <Eye size={14} />
                        <span>Verify Hash</span>
                      </button>
                    </div>

                    {/* Review Section */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Before Approving:</h3>
                      <ul className="text-sm text-yellow-800 space-y-2">
                        <li>✓ Independently verify the certificate with the issuer</li>
                        <li>✓ Check the student's identity</li>
                        <li>✓ Verify the certificate hash matches the registered record</li>
                        <li>✓ Confirm all details are accurate</li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => handleApproveAchievement(selectedAchievement)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
                      >
                        <CheckCircle size={18} />
                        <span>Approve & Award 150 SKC</span>
                      </button>
                      <button
                        onClick={() => handleRejectAchievement(selectedAchievement)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2"
                      >
                        <X size={18} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select an achievement to review</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificate Registry Tab */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Register New */}
            <div className="lg:col-span-1">
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Register New Certificate</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Hash <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={hashInput}
                      onChange={(e) => setHashInput(e.target.value)}
                      placeholder="0x..."
                      className="form-input text-xs font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Keccak-256 hash of the certificate</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issuer Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={issuerInput}
                      onChange={(e) => setIssuerInput(e.target.value)}
                      placeholder="e.g., AWS Academy"
                      className="form-input"
                    />
                  </div>

                  <button
                    onClick={handleRegisterHash}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                  >
                    <Hash size={18} />
                    <span>Register Hash</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Registered List */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Registered Certificates</h2>
                <div className="space-y-3">
                  {registeredCertificates.map((cert) => (
                    <div key={cert.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{cert.issuer}</h3>
                          <p className="text-xs text-gray-600 mt-1 break-all font-mono">{cert.hash}</p>
                          <p className="text-xs text-gray-500 mt-2">Registered: {cert.registeredDate}</p>
                        </div>
                        <div className="ml-4">
                          {cert.verified && (
                            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                              <CheckCircle size={18} />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifierPanel;
