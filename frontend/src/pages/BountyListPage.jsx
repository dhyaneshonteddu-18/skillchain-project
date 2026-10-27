import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Users, Calendar, TrendingUp, Plus, Filter } from 'lucide-react';

const BountyListPage = () => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState('all'); // all, open, in-progress, completed
  const [sortBy, setSortBy] = useState('reward'); // reward, deadline, recent

  // Mock bounties data
  const allBounties = [
    {
      id: 1,
      title: 'Build Smart Contract ABI Parser',
      description: 'Create a tool to parse and validate smart contract ABIs',
      requiredSkill: 'WEB3_DEVELOPER',
      reward: 300,
      status: 'open',
      applicants: 5,
      deadline: '2024-02-15',
      difficulty: 'advanced',
      submissions: [],
    },
    {
      id: 2,
      title: 'Design Landing Page for Web3 App',
      description: 'Create a modern, responsive landing page with Figma designs',
      requiredSkill: 'WEB3_DEVELOPER',
      reward: 200,
      status: 'open',
      applicants: 8,
      deadline: '2024-02-10',
      difficulty: 'intermediate',
      submissions: [],
    },
    {
      id: 3,
      title: 'Write Documentation for SkillChain API',
      description: 'Comprehensive API documentation with examples and tutorials',
      requiredSkill: 'PYTHON_DEVELOPER',
      reward: 150,
      status: 'in-progress',
      applicants: 3,
      deadline: '2024-02-05',
      difficulty: 'beginner',
      submissions: 1,
    },
    {
      id: 4,
      title: 'Optimize Database Queries',
      description: 'Improve query performance by 50% using indexing and caching',
      requiredSkill: 'PYTHON_DEVELOPER',
      reward: 250,
      status: 'open',
      applicants: 2,
      deadline: '2024-02-20',
      difficulty: 'advanced',
      submissions: [],
    },
    {
      id: 5,
      title: 'Create Video Tutorial Series',
      description: '5-part video tutorial on building blockchain applications',
      requiredSkill: 'OPEN_SOURCE_CONTRIBUTOR',
      reward: 400,
      status: 'completed',
      applicants: 1,
      deadline: '2024-01-20',
      difficulty: 'intermediate',
      submissions: 1,
    },
  ];

  // Filter bounties
  let filteredBounties = allBounties;
  if (filterType !== 'all') {
    filteredBounties = allBounties.filter(b => b.status === filterType);
  }

  // Sort bounties
  if (sortBy === 'reward') {
    filteredBounties.sort((a, b) => b.reward - a.reward);
  } else if (sortBy === 'deadline') {
    filteredBounties.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else if (sortBy === 'recent') {
    filteredBounties.reverse();
  }

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Bounty Board</h1>
            <p className="text-gray-600 mt-2">Earn SkillCoins by completing tasks</p>
          </div>
          {user?.role === 'employer' && (
            <Link
              to="/create-bounty"
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} />
              <span>Create Bounty</span>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Bounties</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {allBounties.filter(b => b.status === 'open').length}
                </p>
              </div>
              <TrendingUp size={24} className="text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {allBounties.filter(b => b.status === 'in-progress').length}
                </p>
              </div>
              <Zap size={24} className="text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {allBounties.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <TrendingUp size={24} className="text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bounty Pool</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {allBounties.reduce((sum, b) => sum + b.reward, 0)} SKC
                </p>
              </div>
              <Zap size={24} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Filter size={16} />
                <span>Status</span>
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Bounties</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <TrendingUp size={16} />
                <span>Sort By</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="reward">Highest Reward</option>
                <option value="deadline">Earliest Deadline</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bounties List */}
        <div className="space-y-4">
          {filteredBounties.length > 0 ? (
            filteredBounties.map(bounty => (
              <Link
                key={bounty.id}
                to={`/bounty/${bounty.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bounty.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(bounty.status)}`}>
                        {bounty.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className={`text-xs font-medium ${getDifficultyColor(bounty.difficulty)}`}>
                        {bounty.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {bounty.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar size={16} />
                        <span>Due: {new Date(bounty.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Users size={16} />
                        <span>{bounty.applicants} applicants</span>
                      </div>
                      {bounty.submissions > 0 && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <TrendingUp size={16} />
                          <span>{bounty.submissions} submission(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 text-right flex-shrink-0">
                    <div className="flex items-center space-x-1 mb-2">
                      <Zap size={20} className="text-yellow-600" />
                      <p className="text-2xl font-bold text-yellow-600">
                        {bounty.reward}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600">SKC Reward</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600">No bounties found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BountyListPage;
