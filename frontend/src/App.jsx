import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BlockchainProvider } from './context/BlockchainContext';
import { useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import StudentAchievements from './pages/StudentAchievements';
import VerifierPanel from './pages/VerifierPanel';
import EmployerLookup from './pages/EmployerLookup';
import BountyBoard from './pages/BountyBoard';
import CertificateVerification from './pages/CertificateVerification';
import CertificateUpload from './pages/CertificateUpload';
import ApproveAchievement from './pages/ApproveAchievement';
import EmployerLookupPage from './pages/EmployerLookupPage';
import PublicCertificateVerify from './pages/PublicCertificateVerify';
import BountyListPage from './pages/BountyListPage';
import CreateBountyPage from './pages/CreateBountyPage';
import Home from './pages/Home';
import AdminRegisterHash from './pages/AdminRegisterHash';
import StudentBadges from './pages/StudentBadges';
import GettingStarted from './pages/GettingStarted';
import StudentBountyPage from './pages/StudentBountyPage';
import VerifyPendingCertificates from './pages/VerifyPendingCertificates';
import VerifyDuplicateDetection from './pages/VerifyDuplicateDetection';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/start" element={<GettingStarted />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verifier-dashboard"
                element={
                  <ProtectedRoute requiredRole={['verifier', 'admin']}>
                    <VerifierDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/achievements"
                element={
                  <ProtectedRoute requiredRole={['student']}>
                    <StudentAchievements />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verifier"
                element={
                  <ProtectedRoute requiredRole={['verifier', 'admin']}>
                    <VerifierPanel />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employer"
                element={
                  <ProtectedRoute requiredRole={['employer']}>
                    <EmployerLookup />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bounties"
                element={
                  <ProtectedRoute requiredRole={['student', 'verifier']}>
                    <BountyBoard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verify-certificate"
                element={
                  <ProtectedRoute>
                    <CertificateVerification />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/upload-certificate"
                element={
                  <ProtectedRoute requiredRole={['student']}>
                    <CertificateUpload />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/approve-achievement"
                element={
                  <ProtectedRoute requiredRole={['verifier', 'admin']}>
                    <ApproveAchievement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employer-lookup"
                element={
                  <ProtectedRoute requiredRole={['employer']}>
                    <EmployerLookupPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verify-certificate-public"
                element={<PublicCertificateVerify />}
              />

              <Route
                path="/bounty-list"
                element={
                  <ProtectedRoute>
                    <BountyListPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student-bounty"
                element={
                  <ProtectedRoute requiredRole={['student']}>
                    <StudentBountyPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/create-bounty"
                element={
                  <ProtectedRoute requiredRole={['employer']}>
                    <CreateBountyPage />
                  </ProtectedRoute>
                }
              />

              {/* Simplified routing (matching user navigation) */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute requiredRole={['student']}><CertificateUpload /></ProtectedRoute>} />
              <Route path="/verify" element={<PublicCertificateVerify />} />
              <Route path="/badges" element={<ProtectedRoute requiredRole={['student']}><StudentBadges /></ProtectedRoute>} />
              <Route path="/register-hash" element={<ProtectedRoute><AdminRegisterHash /></ProtectedRoute>} />
              <Route path="/verify-pending" element={<ProtectedRoute><VerifyDuplicateDetection /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </BrowserRouter>
      </BlockchainProvider>
    </AuthProvider>
  );
}

export default App;
