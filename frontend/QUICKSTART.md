# SkillChain Frontend - Quick Start Guide

## ⚡ 30-Second Setup

```bash
# 1. Navigate to frontend
cd /Users/tripurasundari/SkillChain-Upgrade/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**App opens at `http://localhost:3000` automatically** ✨

---

## 🧪 Try It Out

### Test Login
```
Email: demo@skillchain.local
Password: demo123456
```

### Test Employer Lookup
```
Wallet: 0x1234567890123456789012345678901234567890
```

---

## 📍 Key Routes

| Path | Purpose | Auth |
|------|---------|------|
| `/` | Home page | ❌ |
| `/login` | Login | ❌ |
| `/register` | Register | ❌ |
| `/dashboard` | Dashboard | ✅ |
| `/achievements` | My Achievements | ✅ |
| `/verifier` | Verifier Panel | ✅ |
| `/employer` | Employer Lookup | ✅ |
| `/bounties` | Bounty Board | ✅ |
| `/verify-certificate` | Certificate Verification | ✅ |

---

## 📂 Project Structure

```
src/
├── pages/                    # 9 page components
├── components/              # 4 reusable components
├── context/                 # Auth & Blockchain state
├── services/                # API endpoints
├── utils/                   # Validation & formatting
└── App.jsx                  # Main app with routing
```

---

## 🎯 What's Implemented

✅ **Module 1**: Certificate Hash Verification
✅ **Module 2**: Achievement Registry (Students + Verifiers)
✅ **Module 3**: SkillCoin Rewards (ERC-20)
✅ **Module 4**: Digital Badges (ERC-721 NFT)
✅ **Module 5**: Bounty Board (Tasks + Rewards)

✅ **Auth**: Registration + Login with password toggle
✅ **UI**: Responsive design, Tailwind CSS, Lucide icons
✅ **Blockchain**: MetaMask integration ready
✅ **Errors**: Clear, actionable error messages
✅ **Validation**: Zod schemas for all forms

---

## ⚙️ Configuration

### Environment Variables
Create `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_NETWORK_MODE=local
VITE_SKILL_COIN_ADDRESS=0x...
VITE_SKILL_BADGE_ADDRESS=0x...
VITE_ACHIEVEMENT_REGISTRY_ADDRESS=0x...
VITE_CERTIFICATE_HASH_REGISTRY_ADDRESS=0x...
VITE_SKILL_BOUNTY_ADDRESS=0x...
```

---

## 📦 Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Blockchain**: Ethers.js v6
- **Icons**: Lucide React
- **HTTP**: Axios

---

## 🔐 Security Notes

❌ **Don't commit**:
- `.env.local` with real keys
- Private keys or secrets
- API credentials

✅ **Do use**:
- Environment variables for secrets
- HTTPS in production
- MetaMask for wallet management

---

## 🐛 Troubleshooting

### Port 3000 in use?
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Dependencies not installing?
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### MetaMask not connecting?
- Ensure MetaMask is installed
- Check if wallet is unlocked
- Try disconnecting/reconnecting

---

## 📝 Common Tasks

### Add a New Page
1. Create `src/pages/MyPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navigation.jsx`

### Add API Endpoint
1. Add function to `src/services/api.js`
2. Use in components: `import { myAPI } from '../services/api'`

### Validate Form
1. Create Zod schema in `src/utils/validation.js`
2. Import and use: `mySchema.parse(formData)`

---

## 🚀 Production Build

```bash
# Build for production
npm run build

# Output goes to dist/ folder
# Deploy to Vercel, Netlify, or any static host
```

---

## 📞 Need Help?

Check these files:
- `README.md` - Full setup guide
- `FEATURES.md` - Complete feature list
- `.env.example` - Configuration template
- Code comments throughout

---

**Get started now: `npm install && npm run dev`** 🎉
