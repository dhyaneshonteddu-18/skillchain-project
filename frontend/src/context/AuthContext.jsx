import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Create a simple database of registered users in localStorage
const initializeUserDatabase = () => {
  if (!localStorage.getItem('skillchain_users')) {
    localStorage.setItem('skillchain_users', JSON.stringify({}));
  }
};

const registerUserInDatabase = (email, fullName, role) => {
  const users = JSON.parse(localStorage.getItem('skillchain_users') || '{}');
  users[email.toLowerCase()] = { email, fullName, role };
  localStorage.setItem('skillchain_users', JSON.stringify(users));
};

const getUserFromDatabase = (email) => {
  const users = JSON.parse(localStorage.getItem('skillchain_users') || '{}');
  return users[email.toLowerCase()];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);

  // Verify MetaMask connection is still valid
  const verifyMetaMaskConnection = async (storedWallet) => {
    try {
      if (!window.ethereum) {
        // MetaMask not installed
        localStorage.removeItem('wallet');
        return false;
      }

      // Try to get current accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      // Check if wallet is still connected
      if (!accounts || accounts.length === 0) {
        // MetaMask is locked or disconnected
        localStorage.removeItem('wallet');
        return false;
      }

      // Check if the stored wallet matches current account
      if (accounts[0].toLowerCase() !== storedWallet.toLowerCase()) {
        // User switched accounts in MetaMask
        localStorage.removeItem('wallet');
        return false;
      }

      // Try to get chain ID - if this fails, MetaMask might be locked
      try {
        await window.ethereum.request({ method: 'eth_chainId' });
        return true;
      } catch (chainError) {
        // Cannot get chain ID - MetaMask is likely locked
        localStorage.removeItem('wallet');
        return false;
      }
    } catch (error) {
      console.warn('MetaMask connection verification failed:', error);
      localStorage.removeItem('wallet');
      return false;
    }
  };

  // Load auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      initializeUserDatabase();
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      const storedWallet = localStorage.getItem('wallet');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      // Verify wallet connection is still valid before restoring it
      if (storedWallet) {
        const isValid = await verifyMetaMaskConnection(storedWallet);
        if (isValid) {
          setWallet(storedWallet);
          setWalletConnected(true);
        } else {
          // Wallet is not connected - clear it
          setWallet(null);
          setWalletConnected(false);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    // Also register in database so role persists after logout
    registerUserInDatabase(userData.email, userData.fullName, userData.role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWallet(null);
    setWalletConnected(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('wallet');
    // Keep user database - don't delete registered users
  };

  const connectWallet = async (address) => {
    try {
      // Verify the wallet can be accessed (MetaMask is unlocked)
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Try to get chain ID to verify MetaMask is unlocked
      try {
        await window.ethereum.request({ method: 'eth_chainId' });
      } catch (error) {
        throw new Error('MetaMask is locked. Please unlock it to continue.');
      }

      // Verify the address is currently connected
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No MetaMask account connected');
      }

      if (accounts[0].toLowerCase() !== address.toLowerCase()) {
        throw new Error('Connected account does not match. Please select the correct account in MetaMask.');
      }

      // Connection is valid - store it
      setWallet(address);
      setWalletConnected(true);
      localStorage.setItem('wallet', address);
    } catch (error) {
      console.error('Wallet connection error:', error);
      // Don't set connected state if verification fails
      setWallet(null);
      setWalletConnected(false);
      localStorage.removeItem('wallet');
      throw error;
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setWalletConnected(false);
    localStorage.removeItem('wallet');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        wallet,
        walletConnected,
        loading,
        login,
        logout,
        connectWallet,
        disconnectWallet,
        getUserFromDatabase
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
