# SkillChain Frontend - React + Vite

A modern, user-friendly web application for the SkillChain blockchain-based student skill passport system.

## Features

✨ **Complete SkillChain Modules**
- 🎓 Student Achievement Submission & Tracking
- ✅ Verifier Panel with Achievement Approval
- 💼 Employer Student Lookup & Verification
- 💰 SkillCoin Rewards Management
- 🏆 Digital NFT Badges
- 🎯 Skill Bounty Board with Task Management
- 🔐 Certificate Hash Verification

✨ **User Experience**
- 📱 Responsive Design (Mobile, Tablet, Desktop)
- 🔐 Secure Authentication with Password Toggle
- 🎨 Clean, Modern UI with Tailwind CSS
- ⚡ Real-time Error Handling & Validation
- 🔄 Blockchain Integration with MetaMask

## Tech Stack

- **Frontend Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + Context API
- **Blockchain**: Ethers.js v6
- **Form Validation**: React Hook Form + Zod
- **UI Components**: Lucide Icons
- **HTTP Client**: Axios

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navigation.jsx
│   ├── FormInput.jsx
│   ├── Alert.jsx
│   └── LoadingSpinner.jsx
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── StudentAchievements.jsx
│   ├── VerifierPanel.jsx
│   ├── EmployerLookup.jsx
│   ├── BountyBoard.jsx
│   └── CertificateVerification.jsx
├── context/            # React Context
│   ├── AuthContext.jsx
│   └── BlockchainContext.jsx
├── services/           # API & blockchain services
│   └── api.js
├── utils/              # Utility functions
│   ├── formatting.js
│   └── validation.js
├── types/              # TypeScript types
│   └── index.js
├── App.jsx
├── main.jsx
└── index.css
```

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask browser extension

### Setup

1. **Clone and install dependencies**
```bash
cd frontend
npm install
```

2. **Create environment file**
```bash
cp .env.example .env.local
```

3. **Configure environment variables**
Edit `.env.local` with your blockchain addresses:
```env
VITE_NETWORK_MODE=local
VITE_SKILL_COIN_ADDRESS=0x...
VITE_SKILL_BADGE_ADDRESS=0x...
VITE_ACHIEVEMENT_REGISTRY_ADDRESS=0x...
VITE_CERTIFICATE_HASH_REGISTRY_ADDRESS=0x...
VITE_SKILL_BOUNTY_ADDRESS=0x...
```

4. **Start development server**
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Usage

### User Roles

**Student**
- Register account
- Submit achievements for verification
- View approved badges and SkillCoins
- Browse and submit bounty work
- Compute & verify certificate hashes

**Verifier**
- Review pending achievements
- Approve/reject with blockchain transaction
- Register certificate hashes
- Create and manage bounties
- Review bounty submissions

**Employer**
- Search students by wallet address
- View verified achievements
- Check SkillCoin balance
- No wallet connection required for lookup

### Key Workflows

#### 1. Student Submits Achievement
```
Login → Dashboard → My Achievements → Submit Achievement
→ Select achievement type → Upload proof URI → Wait for approval
```

#### 2. Verifier Reviews & Approves
```
Login → Verifier Panel → Select achievement
→ Verify certificate hash → Approve → Award SKC + Badge
```

#### 3. Certificate Verification
```
Certificate Verification → Upload file → Compute hash
→ Share with verifier → Verifier registers hash on blockchain
→ Use hash in achievement submission
```

#### 4. Employer Lookup
```
Employer Lookup → Enter student wallet address
→ View achievements, badges, SkillCoin balance
```

#### 5. Bounty Workflow
```
Student: Browse Bounties → Select task → Submit work with IPFS link
Creator: Verifier Panel → Review submission → Approve/reject
Student: Receives SKC reward on approval
```

## Error Handling

The application provides clear error messages for:
- ❌ Invalid form inputs with field-level validation
- ❌ MetaMask connection failures
- ❌ Blockchain transaction errors
- ❌ API request failures
- ❌ File upload issues
- ❌ Wallet/network mismatches

All errors are displayed as alerts with actionable messages.

## Authentication

- Email/password registration and login
- JWT tokens stored in localStorage
- Automatic token refresh on login
- Separate blockchain wallet connection via MetaMask
- User profile management

## Blockchain Integration

### Smart Contracts Supported
- **SkillCoin (ERC-20)**: Reward token minting and transfers
- **SkillBadge (ERC-721)**: NFT-based achievement badges
- **AchievementRegistry**: Achievement approval and rewards
- **CertificateHashRegistry**: Certificate hash registration & verification
- **SkillBounty**: Bounty creation, submission, and approval workflow

### Network Configuration
- **Local**: Hardhat network at `http://127.0.0.1:8545`
- **Amoy**: Polygon Amoy testnet at `https://rpc-amoy.polygon.technology`

Change network in `.env.local`:
```env
VITE_NETWORK_MODE=local  # or 'amoy'
```

## Development

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navigation.jsx`

### Adding a New API Endpoint
1. Add function to `src/services/api.js`
2. Use in components via `import { someAPI } from '../services/api'`

### Form Validation
Use Zod schemas in `src/utils/validation.js`:
```jsx
import { registerSchema } from '../utils/validation';

const validated = registerSchema.parse(formData);
```

## Building for Production

```bash
npm run build
```

Output goes to `dist/` directory. Deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.).

## Demo Credentials

For testing without creating an account:
- **Email**: demo@skillchain.local
- **Password**: demo123456

## Demo Wallet Address

For employer lookup demo:
```
0x1234567890123456789012345678901234567890
```

## Security Notes

⚠️ **Never commit**:
- `.env.local` with real private keys
- API secrets or keys
- Wallet private keys

✅ **Best practices**:
- Always use `localStorage` for public data only
- Keep private keys in environment variables
- Never expose MetaMask wallet to console
- Use HTTPS in production
- Implement rate limiting on backend

## Troubleshooting

### MetaMask Connection Issues
- Ensure MetaMask is installed
- Check selected network matches config
- Try disconnecting and reconnecting wallet

### Contract Address Errors
- Verify addresses in `.env.local` are correct
- Ensure contracts are deployed to selected network
- Check contract addresses on block explorer

### API Connection Errors
- Verify backend is running on configured port
- Check `VITE_API_BASE_URL` in `.env.local`
- Look for CORS issues in browser console

### File Upload Fails
- Check file size (max 10MB)
- Verify file type (PDF, PNG, JPEG only)
- Ensure IPFS is accessible

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- 📧 support@skillchain.local
- 🐛 GitHub Issues
- 💬 Community Discord

## Next Steps

1. Set up backend API server
2. Deploy smart contracts to testnet
3. Configure contract addresses in `.env.local`
4. Test all workflows end-to-end
5. Deploy to production

---

**Built with ❤️ for SkillChain**
