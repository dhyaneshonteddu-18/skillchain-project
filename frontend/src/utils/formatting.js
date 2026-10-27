import { formatEther, toBeHex } from 'ethers';

// Format wallet address
export const formatAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Format SkillCoin amount
export const formatSkillCoin = (amount, decimals = 18) => {
  if (!amount) return '0 SKC';
  try {
    return `${formatEther(amount)} SKC`;
  } catch {
    return amount;
  }
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time ago
export const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Format transaction hash
export const formatTransactionHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

// Parse IPFS URI
export const parseIPFSURI = (uri) => {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) {
    return {
      type: 'ipfs',
      hash: uri.slice(7),
      gateway: `https://ipfs.io/ipfs/${uri.slice(7)}`
    };
  }
  if (uri.startsWith('http')) {
    return {
      type: 'http',
      url: uri
    };
  }
  return null;
};

// Format error for display
export const formatError = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message?.includes('user rejected')) return 'Transaction rejected by user';
  if (error?.message?.includes('insufficient funds')) return 'Insufficient funds';
  if (error?.message?.includes('already exists')) return 'This record already exists';
  if (error?.message) return error.message;
  return 'An error occurred';
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Format status badge color
export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    open: 'bg-green-100 text-green-800'
  };
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};
