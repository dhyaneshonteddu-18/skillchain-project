# SkillChain Upgrade Package

This package contains updated Solidity contracts and the Angular frontend.

## Before running
- Review `contracts/SKILLCHAIN_UPGRADE.md` and `frontend/SKILLCHAIN_FRONTEND_SETUP.md`.
- The updated contracts require a fresh deployment; the frontend address config is intentionally blank until new deployment addresses are available.
- No real `.env` file, private key, node_modules, generated build artifacts, or personal certificate PDF is included.

## Local commands
Contracts:
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

Frontend in another terminal:
```bash
cd frontend
npm install
npm start
```

For local Hardhat testing, start the node and deploy using the instructions in `contracts/SKILLCHAIN_UPGRADE.md`. For Amoy deployment, use a disposable test wallet only.
