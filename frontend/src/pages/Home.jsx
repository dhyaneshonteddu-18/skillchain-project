import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ArrowRight, Zap, Award, Shield, Users, GraduationCap, TrendingUp, Lock } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation CTA */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 text-center text-sm">
          <p>Get started with verified skill credentials</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Verify Skills on
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                the Blockchain
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload certificates, get verified on blockchain, earn crypto rewards, and let employers verify your
              credentials with confidence.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center justify-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/start"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-gray-400 transition inline-flex items-center justify-center space-x-2"
                >
                  <span>Learn More</span>
                  <ArrowRight size={20} />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center justify-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/start"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-gray-400 transition inline-flex items-center justify-center space-x-2"
                >
                  <span>View Workflow</span>
                  <ArrowRight size={20} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: <Lock size={32} className="text-blue-600" />,
              title: 'Secure & Verified',
              description: 'Your credentials are permanently stored on the Polygon Amoy blockchain and cannot be forged.',
            },
            {
              icon: <Zap size={32} className="text-yellow-600" />,
              title: 'Earn Rewards',
              description: 'Get SKC tokens and achievement badges for each verified skill. Build your crypto portfolio.',
            },
            {
              icon: <Users size={32} className="text-purple-600" />,
              title: 'Employers Trust It',
              description: 'Employers can instantly verify your credentials on-chain. No more fake diplomas.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-8 space-y-4 hover:shadow-lg transition">
              <div className="flex justify-center">{item.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 text-center">{item.title}</h3>
              <p className="text-gray-600 text-center">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-t border-gray-200 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            A simple 4-step process to verify your skills and build your credential on blockchain.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Certificate',
                description: 'Upload your diploma, certificate, or skill proof',
                icon: '📄',
              },
              {
                step: '2',
                title: 'System Registers Hash',
                description: 'Your certificate hash is registered on blockchain',
                icon: '⛓️',
              },
              {
                step: '3',
                title: 'Get Verified',
                description: 'Verifier approves with 2 automatic checks',
                icon: '✅',
              },
              {
                step: '4',
                title: 'Earn Rewards',
                description: 'Receive SKC tokens and achievement badges',
                icon: '🏆',
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg">
                  {item.step}
                </div>
                <div className="text-center">
                  <p className="text-3xl mb-2">{item.icon}</p>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:flex justify-center mt-4">
                    <ArrowRight size={24} className="text-gray-300 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Each User Type */}
      <div className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">SkillChain is for Everyone</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <GraduationCap size={40} className="text-blue-600" />,
                title: 'Students',
                description: 'Verify your skills on blockchain. Earn tokens and badges. Build a verifiable credential portfolio.',
                features: ['Upload certificates', 'Earn SKC rewards', 'Get badges', 'Share credentials'],
                color: 'blue',
              },
              {
                icon: <Shield size={40} className="text-green-600" />,
                title: 'Verifiers',
                description: 'Approve student achievements with automatic verification checks. Keep the system honest.',
                features: ['Register hashes', 'Approve achievements', 'Award tokens', 'Monitor system'],
                color: 'green',
              },
              {
                icon: <TrendingUp size={40} className="text-purple-600" />,
                title: 'Employers',
                description: 'Instantly verify candidate credentials on blockchain. Hire with confidence. No more fakes.',
                features: ['Verify certificates', 'Check authenticity', 'View credentials', 'Hire verified talent'],
                color: 'purple',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8 space-y-6 hover:shadow-lg transition">
                <div className="flex items-center justify-center">{item.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 text-center">{item.title}</h3>
                <p className="text-gray-600 text-center">{item.description}</p>
                <ul className="space-y-2">
                  {item.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center space-x-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className={`text-${item.color}-600 flex-shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Why Choose SkillChain?</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              The most secure and transparent way to verify skills and credentials on blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: 'Blockchain Verified', description: 'All credentials permanently stored on Polygon Amoy blockchain' },
              { title: 'Earn Crypto', description: 'Get paid in SKC tokens for verified skills' },
              { title: 'Tamper Proof', description: 'Hash verification ensures no certificate forgery' },
              { title: 'Instant Verification', description: 'Employers can verify credentials in seconds' },
              { title: 'Transparent System', description: 'All transactions visible on PolygonScan' },
              { title: 'No Middlemen', description: 'Direct peer-to-peer skill verification' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 size={24} className="text-blue-200 flex-shrink-0" />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-blue-100 ml-9">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <h2 className="text-4xl font-bold text-gray-900">Ready to Start?</h2>
        <p className="text-lg text-gray-600">
          Join the blockchain revolution in skill verification. Get started in minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {!user ? (
            <>
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center justify-center space-x-2"
              >
                <span>Create Free Account</span>
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/start"
                className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-gray-400 transition"
              >
                View Workflow
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© 2024 SkillChain. All credentials verified on Polygon Amoy blockchain.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
