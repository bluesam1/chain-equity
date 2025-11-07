# Epic 7: Documentation & Delivery

## Overview

Documentation, submission requirements, timeline, and final delivery checklist.

---

## Submission Requirements

### Code Repository
- [ ] GitHub repo with clear structure
- [ ] contracts/ - Solidity contracts
- [ ] backend/ - Issuer service and cap-table service
- [ ] test/ - Test suite
- [ ] scripts/ - Deployment and demo scripts
- [ ] One-command setup (npm install, npm run setup)
- [ ] .env.example (never commit secrets)

### Documentation
- [ ] README.md with setup instructions
- [ ] Technical writeup (1-2 pages):
  - Chain selection rationale
  - Corporate action implementation approach
  - Key architectural decisions
  - Known limitations and risks
- [ ] Decision log for key choices
- [ ] Gas report for all operations
- [ ] AI tools and prompts used documentation

### Demo
- [ ] Demo video or live presentation
- [ ] Show all test scenarios working
- [ ] Document deployment addresses (if testnet)

### Critical Requirements
- [ ] Disclaimer: NOT regulatory-compliant
- [ ] Testnet only (or local devnet)
- [ ] Secrets in .env (not committed)
- [ ] No turnkey security token platforms

---

## 24 Hour Sprint Timeline

### Phase 1: Setup & Core Contract with RBAC (Hours 0-5)
- [ ] Initialize Hardhat project
- [ ] Install dependencies (OpenZeppelin, ethers, Supabase client)
- [ ] Set up Supabase project (authentication only)
- [ ] Create ERC-20 contract with AccessControl
- [ ] Define roles: DEFAULT_ADMIN_ROLE, MINTER_ROLE, APPROVER_ROLE
- [ ] Add allowlist mapping and transfer override
- [ ] Implement virtual split logic (base balances + multiplier)
- [ ] Write deployment script
- [ ] Deploy to local Hardhat network
- [ ] Write initial contract tests

### Phase 2: Backend Service (Hours 5-9)
- [ ] Create backend service for contract interactions
- [ ] Implement wallet approval functions (role-gated)
- [ ] Implement minting functions (role-gated)
- [ ] Create helper scripts for contract interaction
- [ ] Test contract interaction functions

### Phase 3: Cap-Table Service (Hours 9-13)
- [ ] Implement blockchain event query service
- [ ] Query Transfer, Mint, Burn events from deployment block
- [ ] Calculate balances by processing events
- [ ] Implement cap-table generation (current state)
- [ ] Add historical snapshot capability (query events up to specific block)
- [ ] Test cap-table accuracy
- [ ] Export cap-table to CSV/JSON

### Phase 4: Corporate Actions (Hours 13-16)
- [ ] Implement virtual split function (update multiplier)
- [ ] Test split: balances scale, ownership % unchanged
- [ ] Implement mutable symbol change function
- [ ] Test symbol updates, balances preserved
- [ ] Document implementation approach

### Phase 5: Web UI Development (Hours 16-21)
- [ ] Initialize Vite.js + React project (TypeScript)
- [ ] Set up TypeScript configuration
- [ ] Set up Tailwind CSS (latest version)
- [ ] Set up Supabase Web3 authentication
- [ ] Create wallet connection (MetaMask/WalletConnect)
- [ ] Implement user session management
- [ ] Configure Firebase Hosting
- [ ] Build admin dashboard components:
  - [ ] Approve wallet UI
  - [ ] Mint tokens UI
  - [ ] Execute split UI
  - [ ] Change symbol UI
- [ ] Build cap-table viewer
- [ ] Connect UI to contract via ethers.js
- [ ] Test all flows through UI

### Phase 6: Testing, Demo & Documentation (Hours 21-24)
- [ ] Run comprehensive test suite
- [ ] Generate gas report
- [ ] Create demo flow (screen recording or live demo)
- [ ] Write technical writeup (1-2 pages)
- [ ] Document architectural decisions
- [ ] Polish README with setup instructions
- [ ] Add disclaimers
- [ ] STRETCH: Deploy to Sepolia testnet
- [ ] Final repo cleanup and submission
- [ ] Submit

---

## Final Checklist Before Submission

- [ ] All code committed to GitHub
- [ ] README has one-command setup
- [ ] Tests pass (npm test)
- [ ] Demo script works (npm run demo)
- [ ] Technical writeup complete
- [ ] Gas report generated
- [ ] Deployment addresses documented
- [ ] Disclaimer included
- [ ] .env.example provided
- [ ] AI usage documented
- [ ] Demo video recorded/script output saved
- [ ] Repo link ready to submit

---

## Contact

**Technical Questions**: Bryce Harris - bharris@peak6.com

---

## Quick Reference

### Initial Setup Commands
```bash
# Create project
mkdir ChainEquity && cd ChainEquity
npm init -y

# Install Hardhat
npm install --save-dev hardhat
npx hardhat init  # Choose "Create a JavaScript project"

# Install dependencies
npm install @openzeppelin/contracts ethers @supabase/supabase-js
npm install --save-dev @nomicfoundation/hardhat-toolbox

# Initialize monorepo structure
npm init -y
npm install -D -w typescript

# Create frontend workspace (Vite.js + React + TypeScript)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install ethers wagmi viem @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# Create backend workspace (TypeScript)
mkdir -p backend/src
cd backend
npm init -y
npm install -D typescript @types/node
npm install ethers @supabase/supabase-js
cd ..
```

### Essential Hardhat Commands
```bash
# Terminal 1: Start local blockchain (keep running)
npx hardhat node

# Terminal 2: Development commands
npx hardhat compile                              # Compile contracts
npx hardhat test                                 # Run tests
npx hardhat run scripts/deploy.ts --network localhost  # Deploy (TypeScript)
npx hardhat run scripts/demo.ts --network localhost    # Run demo (TypeScript)
```

### Supabase Setup
1. Create account at supabase.com
2. Create new project
3. Get API URL and anon key from Settings → API
4. Enable Web3 authentication in Supabase dashboard

### Firebase Hosting Setup
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Configure `firebase.json` to point to `frontend/dist` build output

### Environment Setup
Create `.env` in root and `frontend/.env.local`:
```
# Supabase (for Web3 authentication)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key

# Blockchain
PRIVATE_KEY=your-wallet-private-key
RPC_URL=http://localhost:8545  # For Hardhat local network
# For Sepolia testnet (stretch goal):
# RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract Address (after deployment)
CONTRACT_ADDRESS=deployed-contract-address
```

### Supabase Database Schema (for user profiles)
```sql
-- User profiles table (created automatically by Supabase Web3 auth)
-- Supabase handles wallet authentication and session management
-- Additional user metadata can be stored here if needed
```

---

## Notes & Decisions

_Use this space to track decisions, blockers, and insights as you build_

### Hour 0-4:
- 

### Hour 4-8:
- 

### Hour 8-12:
- 

### Hour 12-16:
- 

### Hour 16-20:
- 

### Hour 20-24:
- 

---

## Optional Hard-Mode Add-Ons
(Only if time permits)

- [ ] Multi-sig admin controls
- [ ] Vesting schedules with cliff
- [ ] Partial transfer restrictions (daily limits)
- [ ] Dividend distribution
- [ ] Upgradeable contracts (proxy pattern)
- [ ] Gas optimization challenge (50% reduction)

