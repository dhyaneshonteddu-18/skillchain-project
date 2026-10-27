import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Achievement validation
export const achievementSchema = z.object({
  achievementType: z.string().min(1, 'Achievement type is required'),
  proofURI: z.string().url('Invalid proof URI'),
  description: z.string().optional()
});

// Certificate hash validation
export const certificateHashSchema = z.object({
  certificateHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid certificate hash'),
  issuer: z.string().min(2, 'Issuer name is required')
});

// Bounty validation
export const bountySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requiredAchievementType: z.string().min(1, 'Required achievement type is required'),
  reward: z.number().min(1, 'Reward must be at least 1 SKC')
});

// File validation for hash computation
export const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg']
};

export const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
  } else {
    if (file.size > fileValidation.maxSize) {
      errors.push(`File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
    if (!fileValidation.allowedTypes.includes(file.type)) {
      errors.push('File type not allowed (PDF, PNG, JPEG only)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Wallet validation
export const validateWalletAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Error messages
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unknown error occurred';
};
