# SkillChain Frontend - Complete Directory Structure

## 📁 Project Layout

```
frontend/
│
├── 📄 package.json                    # npm dependencies & scripts
├── 📄 vite.config.js                 # Vite configuration
├── 📄 tailwind.config.js             # Tailwind CSS configuration
├── 📄 postcss.config.js              # PostCSS configuration
├── 📄 .env.example                   # Environment variables template
├── 📄 .gitignore                     # Git ignore rules
├── 📄 index.html                     # HTML entry point
│
├── 📚 README.md                      # Full setup & usage guide
├── 📚 QUICKSTART.md                  # Quick reference guide
├── 📚 FEATURES.md                    # Complete feature checklist
├── 📚 STRUCTURE.md                   # This file
│
├── node_modules/                     # Dependencies (after npm install)
├── dist/                             # Production build (after npm run build)
│
└── 📁 src/                           # Source code (all written)
    │
    ├── 📄 main.jsx                   # React entry point
    ├── 📄 App.jsx                    # Main App component + routing
    ├── 📄 index.css                  # Global Tailwind styles
    │
    ├── 📁 pages/                     # Page components (9 files)
    │   ├── Home.jsx                  # Landing page
    │   ├── Login.jsx                 # Login page
    │   ├── Register.jsx              # Registration page
    │   ├── Dashboard.jsx             # User dashboard
    │   ├── StudentAchievements.jsx   # Achievement management
    │   ├── VerifierPanel.jsx         # Verifier controls
    │   ├── EmployerLookup.jsx        # Employer search
    │   ├── BountyBoard.jsx           # Bounty management
    │   └── CertificateVerification.jsx # Hash verification
    │
    ├── 📁 components/                # Reusable components (4 files)
    │   ├── Navigation.jsx            # Top navigation bar
    │   ├── FormInput.jsx             # Form field component
    │   ├── Alert.jsx                 # Alert component
    │   └── LoadingSpinner.jsx        # Loading spinner
    │
    ├── 📁 context/                   # Context providers (2 files)
    │   ├── AuthContext.jsx           # Authentication state
    │   └── BlockchainContext.jsx     # Blockchain state
    │
    ├── 📁 services/                  # API & services (1 file)
    │   └── api.js                    # All API endpoints
    │
    ├── 📁 utils/                     # Utility functions (2 files)
    │   ├── validation.js             # Zod validation schemas
    │   └── formatting.js             # Formatting utilities
    │
    └── 📁 types/                     # Type definitions (1 file)
        └── index.js                  # Type definitions

```

---

## 📊 File Count

```
Component Files:     9 pages
Utility Components:  4 components
State Management:    2 contexts
Services:           1 file (with 50+ endpoints)
Utilities:          3 files (validation, formatting, types)
Styles:             2 files (index.css, tailwind config)
Config:             4 files (vite, tailwind, postcss, package.json)
Documentation:      4 files (README, QUICKSTART, FEATURES, STRUCTURE)

TOTAL:              ~30 files created
```

---

## 🎯 File Purposes

### Pages (src/pages/)

| File | Purpose | Module |
|------|---------|--------|
| `Home.jsx` | Landing page with features & CTA | - |
| `Login.jsx` | User login page | Auth |
| `Register.jsx` | User registration page | Auth |
| `Dashboard.jsx` | User dashboard with stats | Dashboard |
| `StudentAchievements.jsx` | Achievement submission & tracking | Module 2 |
| `VerifierPanel.jsx` | Achievement review & approval | Module 2 |
| `EmployerLookup.jsx` | Employer student search | Module 6 |
| `BountyBoard.jsx` | Bounty browsing & submission | Module 5 |
| `CertificateVerification.jsx` | Hash computation & verification | Module 1 |

### Components (src/components/)

| File | Purpose | Reusable |
|------|---------|----------|
| `Navigation.jsx` | Top navigation bar | ✅ |
| `FormInput.jsx` | Form field with password toggle | ✅ |
| `Alert.jsx` | Alert/notification component | ✅ |
| `LoadingSpinner.jsx` | Loading indicator | ✅ |

### Contexts (src/context/)

| File | Purpose | Provides |
|------|---------|----------|
| `AuthContext.jsx` | Authentication state | user, token, login, logout |
| `BlockchainContext.jsx` | Blockchain state | signer, contracts, wallet, blockchain methods |

### Services (src/services/)

| File | Purpose | Endpoints |
|------|---------|-----------|
| `api.js` | All API calls | 30+ endpoints for all modules |

### Utils (src/utils/)

| File | Purpose | Contains |
|------|---------|----------|
| `validation.js` | Zod schemas | 5+ validation schemas |
| `formatting.js` | Format utilities | 10+ formatting functions |

### Config Files (root)

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `vite.config.js` | Vite build configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `index.html` | HTML template |
| `.env.example` | Environment template |
| `.gitignore` | Git ignore rules |

---

## 🚀 Key Files to Modify

### When Connecting to Backend
→ Edit `src/services/api.js`
- Update API base URL
- Modify endpoint paths if needed

### When Connecting to Blockchain
→ Edit `.env.local`
- Add contract addresses
- Set network mode (local/amoy)

### When Adding Routes
→ Edit `src/App.jsx`
- Add new route
- Import page component
- Add to routes array

### When Customizing UI
→ Edit `src/index.css`
- Add custom CSS
- Override Tailwind defaults

→ Edit `tailwind.config.js`
- Add custom colors
- Add fonts
- Extend theme

---

## 📦 Dependencies

### Core
- `react`: UI framework
- `react-dom`: React DOM rendering
- `react-router-dom`: Routing

### Blockchain
- `ethers`: Smart contract interaction

### Forms & Validation
- `react-hook-form`: Form management
- `zod`: Data validation
- `@hookform/resolvers`: Hook Form + Zod integration

### Styling
- `tailwindcss`: Utility-first CSS
- `postcss`: CSS transformation
- `autoprefixer`: CSS vendor prefixes

### UI & UX
- `lucide-react`: Icon library
- `react-hot-toast`: Toast notifications

### HTTP
- `axios`: HTTP client

### Dev Dependencies
- `vite`: Build tool
- `@vitejs/plugin-react`: React plugin for Vite
- `typescript`: Type checking

---

## 🔄 Data Flow

```
User Input
    ↓
Form Component (FormInput.jsx)
    ↓
Form Validation (validation.js - Zod)
    ↓
API Call (api.js - Axios)
    ↓
Context Update (AuthContext/BlockchainContext)
    ↓
Component Re-render
    ↓
Display Result (Success/Error Alert)
    ↓
Blockchain Interaction (MetaMask) - if needed
    ↓
Update UI with Response
```

---

## 🎯 Module Structure

### Certificate Hash Verification (Module 1)
```
CertificateVerification.jsx
├── File upload handling
├── Hash computation
├── Hash verification
└── Registration display
```

### Achievement Registry (Module 2)
```
StudentAchievements.jsx + VerifierPanel.jsx
├── Achievement submission (student)
├── Achievement review (verifier)
├── Hash verification
├── Approval/rejection
└── SKC minting
```

### SkillCoin (Module 3)
```
Dashboard.jsx + Achievement approval
├── Balance display
├── Transaction history
└── Auto-mint on approval
```

### Digital Badges (Module 4)
```
Dashboard.jsx + Achievement approval
├── Badge issuance
├── Badge display
└── Status tracking
```

### Bounty System (Module 5)
```
BountyBoard.jsx
├── Bounty listing
├── Work submission
├── Status tracking
└── Reward distribution
```

---

## 🔐 Authentication Flow

```
Register Page
    ↓
Validation (registerSchema)
    ↓
API: POST /auth/register
    ↓
AuthContext: login()
    ↓
Store JWT + User data
    ↓
Redirect to Dashboard
```

```
Login Page
    ↓
Validation (loginSchema)
    ↓
API: POST /auth/login
    ↓
AuthContext: login()
    ↓
Store JWT + User data
    ↓
Redirect to Dashboard
```

---

## 🛣️ Route Structure

```
App.jsx
├── / → Home
├── /login → Login
├── /register → Register
├── /dashboard → Dashboard (protected)
├── /achievements → StudentAchievements (student only)
├── /verifier → VerifierPanel (verifier only)
├── /employer → EmployerLookup (employer only)
├── /bounties → BountyBoard (student/verifier)
├── /verify-certificate → CertificateVerification (all)
└── * → Redirect to /
```

---

## 🎨 Component Hierarchy

```
App
├── Navigation
├── Routes
│   ├── Home
│   ├── Login
│   ├── Register
│   ├── Dashboard
│   │   └── (4 Stat Cards)
│   ├── StudentAchievements
│   │   ├── FormInput
│   │   ├── Alert
│   │   └── (Achievement Cards)
│   ├── VerifierPanel
│   │   ├── Alert
│   │   └── (Achievement Details)
│   ├── EmployerLookup
│   │   ├── FormInput
│   │   ├── Alert
│   │   └── (Student Info)
│   ├── BountyBoard
│   │   ├── FormInput
│   │   ├── Alert
│   │   └── (Bounty Cards)
│   └── CertificateVerification
│       ├── FormInput
│       ├── Alert
│       └── LoadingSpinner
└── Toaster (react-hot-toast)
```

---

## 💾 Storage

### localStorage
- `authToken`: JWT authentication token
- `user`: User profile JSON
- `wallet`: Connected wallet address

### Context State
- **AuthContext**: User data, login/logout
- **BlockchainContext**: Web3 provider, signer, contracts

### Component State (useState)
- Form data
- Loading/error states
- UI state (open/closed, selected items)

---

## 🚀 Build Output

### Development
```bash
npm run dev
→ Development server at localhost:3000
→ Hot module replacement enabled
→ Source maps for debugging
```

### Production
```bash
npm run build
→ dist/ folder created
→ Minified & optimized code
→ ~200-300 KB total bundle
→ Ready to deploy
```

---

## 📋 Import Patterns

### Components
```javascript
import Navigation from '../components/Navigation';
import FormInput from '../components/FormInput';
```

### Contexts
```javascript
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
```

### Services
```javascript
import { authAPI, achievementAPI, bountyAPI } from '../services/api';
```

### Utils
```javascript
import { registerSchema, loginSchema } from '../utils/validation';
import { formatAddress, formatSkillCoin } from '../utils/formatting';
```

### Icons
```javascript
import { Award, Coins, CheckCircle, X } from 'lucide-react';
```

---

## ✅ Modification Checklist

- [ ] Update `.env.local` with contract addresses
- [ ] Modify `api.js` if API endpoints change
- [ ] Add more validation schemas if needed
- [ ] Customize colors in `tailwind.config.js`
- [ ] Add new pages in `src/pages/`
- [ ] Add new routes in `App.jsx`
- [ ] Update navigation links as needed

---

## 📞 Quick Reference

| Need to... | File | Action |
|-----------|------|--------|
| Add API endpoint | `api.js` | Add function |
| Add validation | `validation.js` | Add Zod schema |
| Add component | `components/` | Create new file |
| Add page | `pages/` | Create new file |
| Add route | `App.jsx` | Add Route element |
| Change styles | `index.css` / `tailwind.config.js` | Edit CSS/config |
| Change colors | `tailwind.config.js` | Edit theme |

---

**All files are ready to use. Happy coding! 🎉**
