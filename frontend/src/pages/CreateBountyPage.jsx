import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Zap, AlertCircle, CheckCircle } from 'lucide-react';

const CreateBountyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState('form'); // form, review, done

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkill: '',
    reward: '',
    deadline: '',
    difficulty: 'intermediate',
  });

  const [createdBounty, setCreatedBounty] = useState(null);

  const SKILL_TYPES = [
    'INTERNSHIP',    // Must match deployed AchievementRegistry types
    'HACKATHON',
    'AWS_CERT',
  ];

  if (!user || user.role !== 'employer') {
    return <Navigate to="/dashboard" />;
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
    if (!formData.title?.trim()) {
      setError('Please enter a bounty title');
      return false;
    }

    if (!formData.description?.trim()) {
      setError('Please enter a bounty description');
      return false;
    }

    if (!formData.requiredSkill) {
      setError('Please select a required skill');
      return false;
    }

    if (!formData.reward || isNaN(formData.reward) || Number(formData.reward) <= 0) {
      setError('Please enter a valid reward amount');
      return false;
    }

    if (Number(formData.reward) > 10000) {
      setError('Reward cannot exceed 10000 SKC');
      return false;
    }

    if (!formData.deadline) {
      setError('Please select a deadline');
      return false;
    }

    const deadline = new Date(formData.deadline);
    if (deadline <= new Date()) {
      setError('Deadline must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStep('review');
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockBountyId = Math.floor(Math.random() * 10000);

      setCreatedBounty({
        id: mockBountyId,
        ...formData,
        reward: Number(formData.reward),
        createdAt: new Date().toISOString(),
        escrowStatus: 'pending',
      });

      setStep('done');
      setSuccess('Bounty created successfully!');
    } catch (err) {
      setError(`Failed to create bounty: ${err.message}`);
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBounty = () => {
    navigate(`/bounty/${createdBounty.id}`);
  };

  const handleCreateAnother = () => {
    setFormData({
      title: '',
      description: '',
      requiredSkill: '',
      reward: '',
      deadline: '',
      difficulty: 'intermediate',
    });
    setCreatedBounty(null);
    setStep('form');
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Create Bounty</h1>
          <p className="text-gray-600 mt-2">Post a task and offer SKC rewards to find the best solution</p>
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

        {/* Step 1: Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Bounty Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Build a React Component Library"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
              <p className="text-xs text-gray-600 mt-1">Max 100 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed description of the bounty requirements..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-600 mt-1">{formData.description.length}/1000 characters</p>
            </div>

            {/* Required Skill */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Required Skill <span className="text-red-600">*</span>
              </label>
              <select
                name="requiredSkill"
                value={formData.requiredSkill}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a required skill...</option>
                {SKILL_TYPES.map(skill => (
                  <option key={skill} value={skill}>
                    {skill.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reward Amount (SKC) <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-yellow-600" />
                  <input
                    type="number"
                    name="reward"
                    value={formData.reward}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="10"
                    max="10000"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Min 10, Max 10,000 SKC</p>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Deadline <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900">How It Works</h3>
                  <ul className="text-sm text-blue-800 space-y-1 mt-2">
                    <li>1. Deposit SKC rewards to escrow when creating</li>
                    <li>2. Students submit solutions by deadline</li>
                    <li>3. You review and approve best submission</li>
                    <li>4. Winner receives SKC from escrow</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 font-medium"
              >
                <Plus size={20} />
                <span>Review Bounty</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Review */}
        {step === 'review' && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review Your Bounty</h2>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{formData.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{formData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <p className="text-sm text-gray-600">Required Skill</p>
                  <p className="text-gray-900 font-semibold mt-1">
                    {formData.requiredSkill.replace(/_/g, ' ')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">
                    {formData.difficulty}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Reward</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Zap size={18} className="text-yellow-600" />
                    <p className="text-lg font-bold text-yellow-600">{formData.reward} SKC</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="text-gray-900 font-semibold mt-1">
                    {new Date(formData.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> {formData.reward} SKC will be locked in escrow. You'll receive them back if no satisfactory submission is received.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center space-x-2 font-medium"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Create Bounty</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setStep('form')}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'done' && createdBounty && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bounty Created!</h2>
                <p className="text-gray-600 mt-1">Your bounty is now live on the board</p>
              </div>
            </div>

            {/* Bounty Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bounty ID</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">#{createdBounty.id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Reward</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Zap size={18} className="text-yellow-600" />
                    <p className="text-lg font-bold text-yellow-600">{createdBounty.reward} SKC</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Escrow Status</p>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">{createdBounty.escrowStatus}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-gray-900 font-semibold mt-1">
                    {new Date(createdBounty.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Your bounty is live on the board</li>
                <li>✓ Students can now apply and submit solutions</li>
                <li>→ Review submissions before deadline</li>
                <li>→ Approve best solution to release reward</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                onClick={handleViewBounty}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                View Bounty
              </button>
              <button
                onClick={handleCreateAnother}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBountyPage;
