import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { Briefcase, Plus, CheckCircle, Clock, MapPin, DollarSign } from 'lucide-react';

const BountyBoard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [proofURI, setProofURI] = useState('');
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    requiredAchievementType: '',
    reward: ''
  });

  // Mock data
  const bounties = [
    {
      id: 1,
      title: 'Build a React Dashboard',
      description: 'Create a responsive dashboard with React, Tailwind CSS, and Chart.js. Should include real-time data updates.',
      creator: 'TechCorp Inc.',
      reward: 200,
      requiredAchievementType: 'React Fundamentals',
      difficulty: 'Intermediate',
      status: 'open',
      submissions: 0,
      postedDate: '2024-01-15',
      deadline: '2024-02-15'
    },
    {
      id: 2,
      title: 'Smart Contract Security Audit',
      description: 'Review and audit provided smart contracts for security vulnerabilities. Report should include findings and recommendations.',
      creator: 'Web3 Labs',
      reward: 350,
      requiredAchievementType: 'Solidity Certification',
      difficulty: 'Advanced',
      status: 'open',
      submissions: 1,
      postedDate: '2024-01-18',
      deadline: '2024-02-20'
    },
    {
      id: 3,
      title: 'AWS Infrastructure Setup',
      description: 'Configure a scalable AWS infrastructure for a multi-tier application with load balancing and auto-scaling.',
      creator: 'CloudTech Solutions',
      reward: 150,
      requiredAchievementType: 'AWS Solutions Architect',
      difficulty: 'Intermediate',
      status: 'open',
      submissions: 2,
      postedDate: '2024-01-10',
      deadline: '2024-02-10'
    }
  ];

  const mySubmissions = [
    {
      bountyId: 1,
      bountyTitle: 'Build a React Dashboard',
      submittedDate: '2024-01-20',
      status: 'pending',
      proofURI: 'ipfs://QmMyReactDashboard'
    }
  ];

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!proofURI) {
      setError('Please provide a proof URI');
      return;
    }

    try {
      setSuccess('Work submitted successfully! Awaiting creator review.');
      setProofURI('');
      setSelectedBounty(null);
    } catch (err) {
      setError('Failed to submit work');
    }
  };

  const handleCreateBounty = async (e) => {
    e.preventDefault();
    if (!createFormData.title || !createFormData.description || !createFormData.reward) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSuccess('Bounty created successfully! Students can now submit work.');
      setCreateFormData({ title: '', description: '', requiredAchievementType: '', reward: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create bounty');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Skill Quest & Bounty Board</h1>
            <p className="text-gray-600 mt-2">Complete tasks and earn SkillCoins</p>
          </div>
          {user?.role === 'verifier' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Create Bounty</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

        {/* Create Form */}
        {showCreateForm && user?.role === 'verifier' && (
          <div className="card mb-8 animate-slide-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Bounty</h2>
            <form onSubmit={handleCreateBounty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bounty Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                  placeholder="e.g., Build a React Dashboard"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                  placeholder="Describe the task in detail"
                  rows="4"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Achievement Type
                  </label>
                  <input
                    type="text"
                    value={createFormData.requiredAchievementType}
                    onChange={(e) => setCreateFormData({...createFormData, requiredAchievementType: e.target.value})}
                    placeholder="e.g., React Fundamentals"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward (SKC) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={createFormData.reward}
                    onChange={(e) => setCreateFormData({...createFormData, reward: e.target.value})}
                    placeholder="100"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Bounty
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'browse'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse Bounties
          </button>
          {user?.role === 'student' && (
            <button
              onClick={() => setActiveTab('mysubmissions')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'mysubmissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Submissions
            </button>
          )}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-3">
              {bounties.map((bounty) => (
                <div
                  key={bounty.id}
                  onClick={() => setSelectedBounty(bounty)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedBounty?.id === bounty.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{bounty.title}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <DollarSign size={16} className="text-yellow-600" />
                    <span className="font-bold text-yellow-600">{bounty.reward} SKC</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{bounty.submissions} submissions</p>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              {selectedBounty ? (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedBounty.title}</h2>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedBounty.difficulty)}`}>
                      {selectedBounty.difficulty}
                    </span>
                    <span className="text-sm text-gray-600">By {selectedBounty.creator}</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{selectedBounty.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-600">Reward</p>
                        <p className="text-2xl font-bold text-yellow-600">{selectedBounty.reward} SKC</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Deadline</p>
                        <p className="text-lg font-bold text-blue-600">{new Date(selectedBounty.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-700">Must have: <span className="font-semibold">{selectedBounty.requiredAchievementType}</span></p>
                      </div>
                    </div>
                  </div>

                  {user?.role === 'student' && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Submit Your Work</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proof URI (IPFS or URL)
                          </label>
                          <input
                            type="text"
                            value={proofURI}
                            onChange={(e) => setProofURI(e.target.value)}
                            placeholder="ipfs://QmXXX or https://..."
                            className="form-input"
                          />
                        </div>
                        <button
                          onClick={handleSubmitWork}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Submit Work
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a bounty to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === 'mysubmissions' && user?.role === 'student' && (
          <div>
            {mySubmissions.length === 0 ? (
              <div className="card text-center py-12">
                <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-600">Submit work on bounties to track your submissions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mySubmissions.map((submission, idx) => (
                  <div key={idx} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{submission.bountyTitle}</h3>
                        <p className="text-sm text-gray-600 mt-1">Submitted {new Date(submission.submittedDate).toLocaleDateString()}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <Clock size={16} className="text-yellow-600" />
                          <span className="text-sm text-yellow-700 font-medium">Pending Review</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-gray-600 break-all">{submission.proofURI}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BountyBoard;
