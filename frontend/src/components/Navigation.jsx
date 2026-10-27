import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { formatAddress } from '../utils/formatting';
import { Menu, X, LogOut, Wallet, ChevronDown } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, wallet, walletConnected, logout, disconnectWallet, connectWallet: authConnect } = useAuth();
  const { connectWallet } = useBlockchain();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Listen for MetaMask account/chain changes
  React.useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
      } else if (accounts[0] !== wallet) {
        // User switched account
        authConnect(accounts[0]);
        connectWallet(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Refresh page on chain change
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet, connectWallet, authConnect, disconnectWallet]);

  const handleConnectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask not installed. Please install it to continue.');
        return;
      }

      // Check if MetaMask is unlocked before requesting accounts
      try {
        await window.ethereum.request({ method: 'eth_chainId' });
      } catch (error) {
        alert('MetaMask is locked. Please unlock MetaMask to continue.');
        return;
      }
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts && accounts[0]) {
        try {
          authConnect(accounts[0]);
          await connectWallet(accounts[0]);
        } catch (connectionError) {
          alert('Failed to connect wallet: ' + connectionError.message);
        }
      }
    } catch (error) {
      if (error.code === 4001) {
        // User rejected the request
        console.log('User rejected wallet connection');
      } else {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    disconnectWallet();
    logout();
    navigate('/');
  };

  const handleDisconnectWallet = () => {
    // Disconnect from the app
    disconnectWallet();
    
    // Note: We cannot disconnect from MetaMask programmatically
    // Users must manually disconnect in MetaMask extension
    // This just removes the wallet from our app state
    
    alert('Wallet disconnected from SkillChain.\n\nNote: To fully disconnect, please also disconnect in MetaMask extension settings.');
  };

  // Role-based navigation
  const getNavLinks = () => {
    if (!user) return [];
    
    const allLinks = {
      student: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Upload Certificate', href: '/upload' },
        { label: 'My Achievements', href: '/achievements' },
        { label: 'My Badges', href: '/badges' },
        { label: 'Bounties', href: '/student-bounty' },
      ],
      verifier: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Review Uploads', href: '/verify-pending' },
        { label: 'Register Hash', href: '/register-hash' },
        { label: 'Approve Achievement', href: '/approve-achievement' },
        { label: 'Verify Certificate', href: '/verify' },
      ],
      admin: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Review Uploads', href: '/verify-pending' },
        { label: 'Register Hash', href: '/register-hash' },
        { label: 'Approve Achievement', href: '/approve-achievement' },
        { label: 'Verify Certificate', href: '/verify' },
      ],
      employer: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Verify Certificate', href: '/verify' },
      ],
    };

    return allLinks[user.role] || [];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="hidden sm:inline font-bold text-lg text-gray-900">SkillChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Wallet Connect */}
            {!walletConnected && user && (
              <button
                onClick={handleConnectWallet}
                className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Connect Wallet
              </button>
            )}
            {walletConnected && (
              <div className="flex items-center space-x-2 text-xs font-mono text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{formatAddress(wallet)}</span>
                <button
                  onClick={handleDisconnectWallet}
                  className="ml-2 text-red-600 hover:text-red-700 text-xs font-medium"
                  title="Disconnect wallet"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <span className="truncate max-w-[100px]">{user.email.split('@')[0]}</span>
                  <ChevronDown size={16} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Auth Links */}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <hr className="my-2" />
                {!walletConnected && (
                  <button
                    onClick={() => {
                      handleConnectWallet();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded transition"
                  >
                    Connect Wallet
                  </button>
                )}
                {walletConnected && (
                  <div className="px-4 py-2 text-xs font-mono text-gray-600">
                    Wallet: {formatAddress(wallet)}
                  </div>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            )}
            {!user && (
              <>
                <hr className="my-2" />
                <Link
                  to="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 bg-blue-600 text-white rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
