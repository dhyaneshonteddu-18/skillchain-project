import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

// Handle network errors gracefully
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Network error or timeout
      console.warn('Network error - API might not be available. Using mock data.');
      return { data: { success: true, data: [] } };
    }
    return Promise.reject(error);
  }
);

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: async (email, password, fullName, role = 'student') => {
    try {
      return await apiClient.post('/auth/register', { email, password, fullName, role });
    } catch (error) {
      // Return mock success for demo with the selected role
      return { data: { success: true, user: { email, fullName, role }, token: 'demo-token' } };
    }
  },
  
  login: async (email, password) => {
    try {
      return await apiClient.post('/auth/login', { email, password });
    } catch (error) {
      // Mock login - check user database for registered user
      const users = JSON.parse(localStorage.getItem('skillchain_users') || '{}');
      const userKey = email.toLowerCase();
      
      if (users[userKey]) {
        const user = users[userKey];
        // Return user with their registered role
        return { data: { success: true, user: { email: user.email, fullName: user.fullName, role: user.role }, token: 'demo-token' } };
      }
      
      // If not in database, return student role as fallback
      return { data: { success: true, user: { email, fullName: email.split('@')[0], role: 'student' }, token: 'demo-token' } };
    }
  },
  
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
};

// Achievement endpoints
export const achievementAPI = {
  submitAchievement: async (data) => {
    try {
      return await apiClient.post('/achievements/submit', data);
    } catch (error) {
      return { data: { success: true } };
    }
  },
  
  getMyAchievements: async () => {
    try {
      return await apiClient.get('/achievements/mine');
    } catch (error) {
      return { data: { success: true, achievements: [] } };
    }
  },
  
  getAllAchievements: async () => {
    try {
      return await apiClient.get('/achievements');
    } catch (error) {
      return { data: { success: true, achievements: [] } };
    }
  },
  
  getAchievementById: (id) => apiClient.get(`/achievements/${id}`),
  updateAchievement: (id, data) => apiClient.put(`/achievements/${id}`, data)
};

// Verifier endpoints
export const verifierAPI = {
  getPendingAchievements: async () => {
    try {
      return await apiClient.get('/verifier/pending-achievements');
    } catch (error) {
      return { data: { success: true, achievements: [] } };
    }
  },
  
  approveAchievement: async (achievementId, data) => {
    try {
      return await apiClient.post(`/verifier/approve/${achievementId}`, data);
    } catch (error) {
      return { data: { success: true } };
    }
  },
  
  rejectAchievement: (achievementId, reason) => apiClient.post(`/verifier/reject/${achievementId}`, { reason }),
  registerCertificateHash: (hash, issuer) => apiClient.post('/verifier/register-certificate', { hash, issuer }),
  verifyCertificateHash: (hash) => apiClient.get(`/verifier/verify-certificate/${hash}`)
};

// Badge endpoints
export const badgeAPI = {
  getMyBadges: async () => {
    try {
      return await apiClient.get('/badges/mine');
    } catch (error) {
      return { data: { success: true, badges: [] } };
    }
  },
  
  getAllBadges: async () => {
    try {
      return await apiClient.get('/badges');
    } catch (error) {
      return { data: { success: true, badges: [] } };
    }
  },
  
  getBadgeById: (id) => apiClient.get(`/badges/${id}`)
};

// SkillCoin endpoints
export const skillCoinAPI = {
  getBalance: (address) => apiClient.get(`/skill-coin/balance/${address}`),
  getTransactionHistory: () => apiClient.get('/skill-coin/history'),
  transferSkillCoin: (recipientAddress, amount) => apiClient.post('/skill-coin/transfer', { recipientAddress, amount })
};

// Bounty endpoints
export const bountyAPI = {
  getBounties: async () => {
    try {
      return await apiClient.get('/bounties');
    } catch (error) {
      return { data: { success: true, bounties: [] } };
    }
  },
  
  getBountyById: (id) => apiClient.get(`/bounties/${id}`),
  getMyBounties: async () => {
    try {
      return await apiClient.get('/bounties/mine');
    } catch (error) {
      return { data: { success: true, bounties: [] } };
    }
  },
  
  createBounty: async (data) => {
    try {
      return await apiClient.post('/bounties', data);
    } catch (error) {
      return { data: { success: true } };
    }
  },
  
  submitBountyWork: async (bountyId, proofURI) => {
    try {
      return await apiClient.post(`/bounties/${bountyId}/submit`, { proofURI });
    } catch (error) {
      return { data: { success: true } };
    }
  },
  
  getSubmissions: (bountyId) => apiClient.get(`/bounties/${bountyId}/submissions`),
  approveSubmission: (bountyId, studentAddress) => apiClient.post(`/bounties/${bountyId}/approve`, { studentAddress }),
  rejectSubmission: (bountyId, studentAddress, reason) => apiClient.post(`/bounties/${bountyId}/reject`, { studentAddress, reason })
};

// Employer lookup endpoints
export const employerAPI = {
  searchStudent: async (walletAddress) => {
    try {
      return await apiClient.get(`/employer/student/${walletAddress}`);
    } catch (error) {
      return { data: { success: true, student: null } };
    }
  },
  
  getStudentAchievements: async (walletAddress) => {
    try {
      return await apiClient.get(`/employer/student/${walletAddress}/achievements`);
    } catch (error) {
      return { data: { success: true, achievements: [] } };
    }
  },
  
  getStudentBalance: async (walletAddress) => {
    try {
      return await apiClient.get(`/employer/student/${walletAddress}/balance`);
    } catch (error) {
      return { data: { success: true, balance: 0 } };
    }
  }
};

// Certificate verification endpoints
export const certificateAPI = {
  registerHash: async (hash, issuer) => {
    try {
      return await apiClient.post('/certificates/register', { hash, issuer });
    } catch (error) {
      return { data: { success: true } };
    }
  },
  
  verifyHash: async (hash) => {
    try {
      return await apiClient.get(`/certificates/verify/${hash}`);
    } catch (error) {
      return { data: { success: true, verified: false } };
    }
  },
  
  getRegisteredCertificates: async () => {
    try {
      return await apiClient.get('/certificates');
    } catch (error) {
      return { data: { success: true, certificates: [] } };
    }
  },

  // Check for duplicate certificate hash
  checkHashDuplicate: async (hash) => {
    try {
      return await apiClient.get(`/certificates/check/${hash}`);
    } catch (error) {
      return { data: { success: true, exists: false } };
    }
  },

  // Upload certificate file to IPFS
  uploadToIPFS: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/ipfs/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default apiClient;
