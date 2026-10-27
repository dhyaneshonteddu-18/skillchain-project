import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { CheckCircle, Clock, AlertCircle, BarChart3, FileText, Users } from 'lucide-react';

const VerifierDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalReviewed: 0,
    pendingCertificates: [],
  });

  // Fetch verifier stats
  useEffect(() => {
    if (user && ['verifier', 'admin'].includes(user.role)) {
      fetchVerifierStats();
    }
  }, [user]);

  const fetchVerifierStats = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      
      // Get pending certificates
      const response = await fetch(`${backendUrl}/api/certificates/pending`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending certificates');
      }

      const data = await response.json();
      const pending = data.certificates || [];

      // Get all certificates to calculate stats
      // Note: This is simplified - in production you'd have dedicated endpoints
      const allCertsResponse = await fetch(`${backendUrl}/api/certificates/history`).catch(() => null);
      let totalApproved = 0, totalRejected = 0;

      if (allCertsResponse?.ok) {
        const allData = await allCertsResponse.json();
        const allCerts = allData.certificates || [];
        totalApproved = allCerts.filter(c => c.status === 'approved').length;
        totalRejected = allCerts.filter(c => c.status === 'rejected').length;
      }

      setStats({
        pendingCount: pending.length,
        approvedCount: totalApproved,
        rejectedCount: totalRejected,
        totalReviewed: totalApproved + totalRejected,
        pendingCertificates: pending.slice(0, 5), // Show first 5
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching verifier stats:', err);
      setError(`Failed to load verifier data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Redirect non-verifiers
  if (!user || !['verifier', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading verifier dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Verifier Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and approve student certificates</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Pending */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Review</p>
                <p className="text-4xl font-bold text-yellow-600 mt-2">{stats.pendingCount}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
              </div>
              <Clock size={40} className="text-yellow-200" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.approvedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Certificates verified</p>
              </div>
              <CheckCircle size={40} className="text-green-200" />
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-4xl font-bold text-red-600 mt-2">{stats.rejectedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Not verified</p>
              </div>
              <AlertCircle size={40} className="text-red-200" />
            </div>
          </div>

          {/* Total Reviewed */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Reviewed</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalReviewed}</p>
                <p className="text-xs text-gray-500 mt-1">All-time</p>
              </div>
              <BarChart3 size={40} className="text-blue-200" />
            </div>
          </div>
        </div>

        {/* Pending Certificates Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText size={28} className="text-blue-600" />
              <span>Pending Certificates</span>
            </h2>
            {stats.pendingCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {stats.pendingCount} waiting
              </span>
            )}
          </div>

          {stats.pendingCount === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">All caught up!</h3>
              <p className="text-gray-600 mt-2">No pending certificates to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.pendingCertificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow transition">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{cert.fileName || 'Unknown Certificate'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Student: {cert.studentEmail || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {cert.uploadedAt ? new Date(cert.uploadedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <Link
                    to="/verify-certificate"
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}

          {stats.pendingCount > 5 && (
            <div className="mt-4 text-center">
              <Link
                to="/verify-certificate"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all pending certificates →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Users size={24} className="text-blue-600" />
            <span>Quick Actions</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/verify-certificate"
              className="p-4 border border-gray-200 rounded-lg hover:shadow transition flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">Review Certificates</h3>
                <p className="text-sm text-gray-600 mt-1">Approve or reject pending certificates</p>
              </div>
              <div className="text-blue-600">→</div>
            </Link>

            <Link
              to="/approve-achievement"
              className="p-4 border border-gray-200 rounded-lg hover:shadow transition flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">Award Achievements</h3>
                <p className="text-sm text-gray-600 mt-1">Award SkillCoins and badges to students</p>
              </div>
              <div className="text-blue-600">→</div>
            </Link>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Your Role</h3>
          <p className="text-sm text-blue-800">
            As a verifier, you are responsible for reviewing student certificates, verifying their authenticity, and awarding SkillCoins and achievement badges upon approval.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;
