import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { Award, Upload, Copy, CheckCircle, Clock, X } from 'lucide-react';

const StudentAchievements = () => {
  const { user } = useAuth();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [formData, setFormData] = useState({
    achievementType: '',
    proofURI: '',
    description: ''
  });

  // Fetch certificates from backend
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        if (!user?.email) {
          setAchievements([]);
          setLoading(false);
          return;
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const response = await fetch(`${backendUrl}/api/certificates/history/${user.email}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const responseData = await response.json();
        
        // Backend returns { success: true, certificates: [...] }
        const certificatesArray = responseData.certificates || responseData.data || [];
        
        if (!Array.isArray(certificatesArray)) {
          console.error('Invalid response format:', responseData);
          throw new Error('Invalid data format from server');
        }
        
        // Transform backend data to match achievement structure
        const transformedAchievements = certificatesArray.map((cert, index) => ({
          id: index + 1,
          type: cert.achievementType || 'Unknown Achievement',
          status: cert.status || 'pending', // pending, approved, rejected
          submittedDate: cert.timestamp || new Date().toISOString(),
          approvedDate: cert.approvedDate || null,
          proofURI: cert.ipfsCid ? `ipfs://${cert.ipfsCid}` : cert.proofURI || '',
          studentWallet: cert.studentWallet,
          analysis: cert.analysis,
          skillsGained: cert.skillsGained || [cert.achievementType?.replace(/_/g, ' ')].filter(Boolean),
          reason: cert.reason // if rejected
        }));

        setAchievements(transformedAchievements);
        setError(null);
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError(`Failed to load achievements: ${err.message}`);
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user?.email]);

  if (!user || user.role !== 'student') {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading your achievements..." />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'rejected':
        return <X size={16} />;
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.achievementType || !formData.proofURI) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Achievement submitted successfully! Awaiting verifier approval.');
      setFormData({ achievementType: '', proofURI: '', description: '' });
      setShowSubmitForm(false);
    } catch (err) {
      setError('Failed to submit achievement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Achievements</h1>
            <p className="text-gray-600 mt-2">Track your verified skills and certifications</p>
          </div>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Upload size={18} />
            <span>Submit Achievement</span>
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

        {/* Submit Form */}
        {showSubmitForm && (
          <div className="card mb-8 animate-slide-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit New Achievement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievement Type <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.achievementType}
                  onChange={(e) => setFormData({...formData, achievementType: e.target.value})}
                  placeholder="e.g., AWS Solutions Architect"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof URI (IPFS or URL) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.proofURI}
                  onChange={(e) => setFormData({...formData, proofURI: e.target.value})}
                  placeholder="ipfs://QmXXX or https://..."
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  🔗 Upload your certificate to IPFS and paste the link here
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Add any additional details about this achievement"
                  rows="3"
                  className="form-input"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Achievement'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Achievements List */}
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <div className="card text-center py-12">
              <Award size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements yet</h3>
              <p className="text-gray-600">Upload a certificate to get started!</p>
            </div>
          ) : (
            achievements.map((achievement) => (
              <div key={achievement.id} className={`card hover:shadow-lg transition border-l-4 ${
                achievement.status === 'approved' ? 'border-l-green-500 bg-green-50' :
                achievement.status === 'pending' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-red-500 bg-red-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Award className={`${
                        achievement.status === 'approved' ? 'text-green-600' :
                        achievement.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`} size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{achievement.type}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(achievement.status)}`}>
                            {getStatusIcon(achievement.status)}
                            <span>{achievement.status.charAt(0).toUpperCase() + achievement.status.slice(1)}</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            Submitted {new Date(achievement.submittedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status-specific information */}
                    {achievement.status === 'approved' && (
                      <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                        <p className="text-sm font-medium text-green-900">✅ Approved on {new Date(achievement.approvedDate || achievement.submittedDate).toLocaleDateString()}</p>
                        {achievement.studentWallet && (
                          <p className="text-xs text-green-800 mt-1 font-mono">Wallet: {achievement.studentWallet}</p>
                        )}
                      </div>
                    )}

                    {achievement.status === 'pending' && (
                      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                        <p className="text-sm font-medium text-yellow-900">⏳ Waiting for verifier approval</p>
                        <p className="text-xs text-yellow-800 mt-1">Your certificate is under review. Check back soon!</p>
                      </div>
                    )}

                    {achievement.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                        <p className="font-medium">❌ Rejected</p>
                        {achievement.reason && <p className="mt-1">{achievement.reason}</p>}
                      </div>
                    )}

                    {achievement.skillsGained && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {achievement.skillsGained.map((skill) => (
                          <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Copy size={16} />
                        <span className="font-mono text-xs truncate">{achievement.proofURI}</span>
                      </div>
                    </div>
                  </div>

                  {achievement.status === 'approved' && (
                    <div className="text-center ml-4">
                      <div className="text-3xl font-bold text-green-600">✓</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-gray-600 text-sm">Total Submitted</p>
            <p className="text-3xl font-bold text-gray-900">{achievements.length}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600">{achievements.filter(a => a.status === 'approved').length}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">{achievements.filter(a => a.status === 'pending').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAchievements;
