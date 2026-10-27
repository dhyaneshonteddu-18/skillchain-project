import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ArrowRight, Zap, Award, Shield, Users } from 'lucide-react';

const GettingStarted = () => {
  const { user } = useAuth();

  const workflows = {
    student: [
      {
        step: 1,
        title: 'Upload Your Certificate',
        description: 'Upload a certificate (PDF or image) to IPFS',
        details: [
          'Go to Dashboard → Upload Certificate',
          'Select your certificate file',
          'System computes a unique hash',
          'File is stored on IPFS',
        ],
        cta: 'Upload Now',
        href: '/upload',
        icon: '📄',
        color: 'blue',
      },
      {
        step: 2,
        title: 'Wait for Admin Approval',
        description: 'Admin registers your certificate hash on blockchain',
        details: [
          'Admin verifies your certificate',
          'Hash is registered in CertificateHashRegistry',
          'Certificate is now on-chain',
          'You receive notification',
        ],
        icon: '⏳',
        color: 'purple',
      },
      {
        step: 3,
        title: 'Claim Your Achievement',
        description: 'Use your certificate to claim rewards',
        details: [
          'Verifier approves achievement with 2 checks',
          'Check 1: Hash must be registered ✓',
          'Check 2: No duplicate claims ✓',
          'You receive SKC tokens + Badge NFT',
        ],
        icon: '🏆',
        color: 'green',
      },
      {
        step: 4,
        title: 'View Your Dashboard',
        description: 'See your achievements and token balance',
        details: [
          'Dashboard shows all earned achievements',
          'View your SKC token balance',
          'See your badge collection',
          'Share your credentials with employers',
        ],
        cta: 'View Dashboard',
        href: '/dashboard',
        icon: '📊',
        color: 'indigo',
      },
    ],
    verifier: [
      {
        step: 1,
        title: 'Register Certificate Hash',
        description: 'Admin: Register verified certificate hashes on blockchain',
        details: [
          'Go to Register Hash page',
          'Enter certificate hash (Keccak-256)',
          'Enter issuer name',
          'Click Register → Confirm in MetaMask',
        ],
        cta: 'Register Hash',
        href: '/register-hash',
        icon: '⛓️',
        color: 'blue',
      },
      {
        step: 2,
        title: 'Approve Achievements',
        description: 'Verify students and award SKC tokens',
        details: [
          'Go to Approve Achievement page',
          'Enter student wallet address',
          'Select achievement type',
          'Link to certificate hash',
        ],
        cta: 'Approve Achievement',
        href: '/approve-achievement',
        icon: '✅',
        color: 'green',
      },
      {
        step: 3,
        title: 'System Checks',
        description: 'Automatic verification on blockchain',
        details: [
          'Check 1: Is hash registered? ✓',
          'Check 2: No duplicate claims? ✓',
          'Both pass: Award tokens + Badge',
          'Transaction on PolygonScan',
        ],
        icon: '🔍',
        color: 'amber',
      },
      {
        step: 4,
        title: 'View Dashboard',
        description: 'Monitor approvals and student progress',
        details: [
          'See approved achievements',
          'Track token distributions',
          'View all transactions',
          'Monitor system health',
        ],
        cta: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
        color: 'indigo',
      },
    ],
    employer: [
      {
        step: 1,
        title: 'Verify Certificates',
        description: 'Public page: Check if certificates are legitimate',
        details: [
          'Go to Verify Certificate page',
          'Enter certificate hash',
          'System verifies on blockchain',
          'See issuer and registration date',
        ],
        cta: 'Verify Certificate',
        href: '/verify',
        icon: '🔐',
        color: 'blue',
      },
      {
        step: 2,
        title: 'Check Authenticity',
        description: 'Confirm student credentials are real',
        details: [
          'Certificate verified on Polygon Amoy',
          'Hash matches registered certificate',
          'Issuer name displayed',
          'Registration timestamp shown',
        ],
        icon: '✓',
        color: 'green',
      },
      {
        step: 3,
        title: 'Make Hiring Decision',
        description: 'Use verified credentials in hiring process',
        details: [
          'Confirmed credentials are legitimate',
          'Can check multiple candidates',
          'View all verified information',
          'Make confident hiring decisions',
        ],
        icon: '👥',
        color: 'purple',
      },
    ],
  };

  const StepCard = ({ step, title, description, details, cta, href, icon, color }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      purple: 'bg-purple-50 border-purple-200',
      amber: 'bg-amber-50 border-amber-200',
      indigo: 'bg-indigo-50 border-indigo-200',
    };

    const ctaClasses = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
      amber: 'bg-amber-600 hover:bg-amber-700 text-white',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    };

    return (
      <div className={`border-2 ${colorClasses[color]} rounded-lg p-6 space-y-4`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-600">Step {step}</div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-700 ml-14">{description}</p>
          </div>
        </div>

        <div className="ml-14 space-y-2">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
              <span>{detail}</span>
            </div>
          ))}
        </div>

        {cta && href && (
          <div className="ml-14 pt-2">
            <Link
              to={href}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${ctaClasses[color]}`}
            >
              <span>{cta}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    );
  };

  const userWorkflow = user ? workflows[user.role] || workflows.student : workflows.student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Getting Started</h1>
          <p className="text-lg text-gray-600">
            {user
              ? `Welcome back! Here's your personalized workflow.`
              : 'Learn how SkillChain works and get started today.'}
          </p>
        </div>
      </div>

      {/* Workflow */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {userWorkflow.map((item, idx) => (
            <div key={idx}>
              <StepCard {...item} />
              {idx < userWorkflow.length - 1 && (
                <div className="flex justify-center py-4">
                  <ArrowRight size={32} className="text-gray-400 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How SkillChain Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Award size={32} className="text-blue-600" />,
                title: 'Verify Skills',
                description: 'Upload certificates and get verified credentials on blockchain',
              },
              {
                icon: <Zap size={32} className="text-yellow-600" />,
                title: 'Earn Rewards',
                description: 'Receive SKC tokens and achievement badges for verified skills',
              },
              {
                icon: <Shield size={32} className="text-green-600" />,
                title: 'Build Trust',
                description: 'Prove your credentials to employers with blockchain verification',
              },
              {
                icon: <Users size={32} className="text-purple-600" />,
                title: 'Connect',
                description: 'Employers can verify and hire verified talent with confidence',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center space-y-4">
                <div className="flex justify-center">{item.icon}</div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-blue-100">
            Join thousands of students and employers verifying skills on the blockchain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
