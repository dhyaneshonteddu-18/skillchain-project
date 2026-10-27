import React, { createContext, useState, useCallback } from 'react';
import { BrowserProvider, Contract, keccak256 } from 'ethers';

export const BlockchainContext = createContext();

// Contract ABIs (simplified - full ABIs needed in production)
const CONTRACT_ABIS = {
  SkillCoin: [
    'function mint(address to, uint256 amount)',
    'function balanceOf(address account) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ],
  SkillBadge: ['function mintBadge(address student, string achievementType_, string proofURI_)', 'function hasAchievementType(address student, string achievementType_) view returns (bool)'],
  AchievementRegistry: ['function approveAchievementWithHash(address student, string achievementType_, string proofURI, bytes32 certificateHash)', 'function setReward(string achievementType_, uint256 wholeTokens)'],
  CertificateHashRegistry: ['function registerCertificate(bytes32 certificateHash, string issuer)', 'function verifyCertificate(bytes32 certificateHash) view returns (bool)'],
  SkillBounty: ['function createBounty(string title, string description, string requiredAchievementType, uint256 reward)', 'function submitWork(uint256 bountyId, string proofURI)', 'function approveSubmission(uint256 bountyId, address student)']
};

export const BlockchainProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [chainId, setChainId] = useState(null);
  const [contracts, setContracts] = useState({});
  const [networkError, setNetworkError] = useState(null);

  // Initialize Web3Provider
  const initializeProvider = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setNetworkError('MetaMask not installed');
        return;
      }

      const web3Provider = new BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const network = await web3Provider.getNetwork();
      setChainId(Number(network.chainId));

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setAccounts(accounts);

      // Get signer
      const signer = await web3Provider.getSigner();
      setSigner(signer);

      setNetworkError(null);
    } catch (error) {
      setNetworkError(error.message);
    }
  }, []);

  // Connect wallet with verification
  const connectWallet = useCallback(async (address) => {
    try {
      if (!address) {
        // Called without address - full initialization
        await initializeProvider();
        return;
      }

      if (!window.ethereum) {
        setNetworkError('MetaMask not installed');
        return;
      }

      // Verify MetaMask is unlocked and accessible
      try {
        await window.ethereum.request({ method: 'eth_chainId' });
      } catch (error) {
        setNetworkError('MetaMask is locked. Please unlock it.');
        throw new Error('MetaMask is locked. Please unlock it.');
      }

      // Verify the account is connected
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (!accounts || accounts.length === 0) {
        setNetworkError('No MetaMask account connected');
        throw new Error('No MetaMask account connected');
      }

      if (accounts[0].toLowerCase() !== address.toLowerCase()) {
        setNetworkError('Connected account does not match');
        throw new Error('Connected account does not match. Please select correct account.');
      }

      // Connection verified - set up provider
      const web3Provider = new BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      setAccounts([address]);
      
      const signer = await web3Provider.getSigner();
      setSigner(signer);
      
      const network = await web3Provider.getNetwork();
      setChainId(Number(network.chainId));
      
      setNetworkError(null);
    } catch (error) {
      setNetworkError(error.message);
      console.error('Connect wallet error:', error);
      throw error;
    }
  }, [initializeProvider]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccounts([]);
    setContracts({});
    setNetworkError(null);
  }, []);

  // Load contract instance
  const loadContract = useCallback(async (contractName, contractAddress) => {
    if (!signer) {
      setNetworkError('Wallet not connected');
      return null;
    }

    try {
      const abi = CONTRACT_ABIS[contractName];
      if (!abi) {
        throw new Error(`Unknown contract: ${contractName}`);
      }

      const contract = new Contract(contractAddress, abi, signer);
      setContracts(prev => ({ ...prev, [contractName]: contract }));
      return contract;
    } catch (error) {
      setNetworkError(error.message);
      return null;
    }
  }, [signer]);

  // Call read function
  const callReadFunction = useCallback(async (contract, functionName, ...args) => {
    try {
      if (!contract) throw new Error('Contract not loaded');
      const result = await contract[functionName](...args);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Call write function
  const callWriteFunction = useCallback(async (contract, functionName, ...args) => {
    try {
      if (!contract) throw new Error('Contract not loaded');
      const tx = await contract[functionName](...args);
      const receipt = await tx.wait();
      return { success: true, transactionHash: receipt.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Compute Keccak-256 hash for files (used for blockchain verification)
  const computeFileHash = useCallback(async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // ethers.js keccak256 requires proper input format
      // Convert Uint8Array to hex string '0x...' format
      let hexString = '0x';
      for (let i = 0; i < uint8Array.length; i++) {
        hexString += uint8Array[i].toString(16).padStart(2, '0');
      }
      
      // Now call keccak256 with hex string
      const hash = keccak256(hexString);
      return { success: true, hash };
    } catch (error) {
      console.error('Keccak-256 hashing error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        provider,
        signer,
        accounts,
        chainId,
        contracts,
        networkError,
        connectWallet,
        disconnectWallet,
        loadContract,
        callReadFunction,
        callWriteFunction,
        computeFileHash
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = React.useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
};
