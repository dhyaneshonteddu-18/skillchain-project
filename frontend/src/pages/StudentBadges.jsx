import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award } from 'lucide-react';

const StudentBadges = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'student') {
    return <Navigate to="/dashboard" />;
  }

  // Mock data - badges earned by student
  const badges = [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Badges</h1>
          <p className="text-gray-600 mt-2">NFT achievement badges you've earned</p>
        </div>

        {/* Badges Grid */}
        {badges.length === 0 ? (
          <div className="card text-center py-12">
            <Award size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No badges yet</h3>
            <p className="text-gray-600">Submit achievements to earn badges</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {badges.map((badge, idx) => (
              <div key={idx} className="card text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="font-semibold text-gray-900">{badge.type}</h3>
                <p className="text-sm text-gray-600 mt-2">Earned: {new Date(badge.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBadges;
