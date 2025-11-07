# ChainEquity PRD - 24 Hour Sprint

## Executive Summary

**What**: Tokenized equity prototype with on-chain compliance gating
**Timeline**: 24 hours
**Demo**: Web UI showing gated transfers, corporate actions, and cap-table management

**Key Features**:
- ERC-20 token with allowlist transfer restrictions (only approved wallets can trade)
- Virtual stock split (7-for-1) using multiplier pattern
- Mutable symbol change for ticker updates
- Cap-table export at any block height (query blockchain directly)
- Role-based admin controls (RBAC)
- Vite.js web interface with MetaMask integration (TypeScript)

**Tech Stack**: Solidity + Hardhat + OpenZeppelin + Supabase (Web3 Auth) + Vite.js + TypeScript + ethers.js

---

## Project Overview
Tokenized security prototype with compliance gating - demonstrating on-chain equity management with transfer restrictions, corporate actions, and cap-table management.

**Target**: Production-quality demo with Web UI and blockchain integration.

---

## Core Deliverables

### 1. Gated Token Contract
- [ ] ERC-20 standard token implementation
- [ ] Allowlist mechanism for transfer restrictions
- [ ] Transfer validation: check BOTH sender AND recipient on allowlist
- [ ] Revert transfers if either party not approved
- [ ] Admin functions: add/remove from allowlist, mint tokens
- [ ] Events: Transfer, Approval, AllowlistUpdate, Mint

### 2. Issuer Service (Backend/CLI)
- [ ] Approve/deny wallet addresses (KYC mock)
- [ ] Submit allowlist updates to contract
- [ ] Mint tokens to approved wallets
- [ ] Query allowlist status
- [ ] Trigger corporate actions
- [ ] Implementation: Node.js/Python + web3 library

### 3. Cap-Table Export
- [ ] Query blockchain directly for Transfer, Mint, Burn events
- [ ] Calculate balances by processing events from deployment block
- [ ] Calculate ownership percentages using BigNumber division (avoid JavaScript number precision loss)
- [ ] Format percentages as strings with fixed decimal precision (6-8 decimals)
- [ ] Generate "as-of block" snapshots by querying events up to specific block height
- [ ] Export cap-table in CSV/JSON format
- [ ] Include: wallet address, balance, ownership % (as string to preserve precision)
- [ ] Query historical cap-table at any block height
- [ ] Note: Percentages may not sum to exactly 100% due to rounding (document this)

### 4. Corporate Actions (Required: Both)

#### Action 1: 7-for-1 Stock Split
- [ ] Multiply all balances by 7
- [ ] Maintain proportional ownership
- [ ] Update total supply accordingly
- [ ] Emit event documenting split
- [ ] Document implementation approach and tradeoffs

#### Action 2: Symbol/Ticker Change
- [ ] Change token symbol (e.g., "OLD" → "NEW")
- [ ] Preserve all balances and ownership
- [ ] Update metadata visible to explorers/wallets
- [ ] Emit event documenting change
- [ ] Document implementation approach and tradeoffs

### 5. Operator Demo (CLI or UI)
- [ ] Mint tokens to approved wallet → SUCCESS
- [ ] Transfer between two approved wallets → SUCCESS
- [ ] Transfer to non-approved wallet → BLOCKED
- [ ] Approve new wallet → Transfer now succeeds
- [ ] Execute 7-for-1 split → Balances multiply by 7
- [ ] Change ticker symbol → Symbol updates, balances unchanged
- [ ] Export cap-table at specific block

---

## Technical Stack

**Blockchain**: Hardhat Network (local development) + Sepolia testnet (stretch goal for public demo)

**Smart Contracts**:
- Solidity 0.8.x
- Hardhat development framework
- OpenZeppelin: ERC20 base + AccessControl for RBAC

**Backend & Authentication**:
- Supabase (Web3 authentication and user sessions)
- Node.js + ethers.js v6
- Direct blockchain queries for cap-table generation

**Frontend**:
- Vite.js (React framework with TypeScript)
- Tailwind CSS (latest version) for styling
- ethers.js v6 for blockchain interaction (TypeScript)
- Wallet connection via MetaMask/WalletConnect
- Firebase Hosting for deployment

**Key Dependencies**:
```json
{
  "@openzeppelin/contracts": "^5.0.0",
  "ethers": "^6.x",
  "@supabase/supabase-js": "^2.x",
  "hardhat": "^2.x",
  "vite": "^5.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "wagmi": "^2.x"
}
```

---

## Project Structure

```
ChainEquity/                           # Monorepo root
├── contracts/                         # Hardhat workspace
│   ├── src/
│   │   └── ChainEquityToken.sol       # Main token contract with RBAC & virtual split
│   ├── scripts/
│   │   ├── deploy.ts                  # Deployment script (TypeScript)
│   │   └── demo.ts                    # Demo flow script (TypeScript)
│   ├── test/
│   │   └── ChainEquityToken.test.ts   # Contract test suite (TypeScript)
│   └── hardhat.config.ts              # Hardhat configuration (TypeScript)
├── backend/                           # Backend workspace
│   ├── src/
│   │   ├── cap-table.ts               # Cap-table generation (TypeScript)
│   │   └── issuer.ts                  # Issuer service (TypeScript)
│   └── package.json
├── frontend/                          # Frontend workspace (Vite.js)
│   ├── src/
│   │   ├── pages/                     # React pages/components
│   │   ├── components/                # React components (TypeScript)
│   │   ├── lib/                       # Contract interaction utilities (TypeScript)
│   │   └── main.tsx                   # Vite entry point
│   ├── vite.config.ts                 # Vite configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   └── package.json
├── package.json                        # Root package.json (monorepo workspace config)
├── .env.example                       # Environment variables template
├── firebase.json                      # Firebase Hosting configuration
└── README.md                          # Setup instructions
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Vite.js + React Web UI                  │
│              (TypeScript)                            │
│  - Wallet connection (MetaMask)                     │
│  - Supabase Web3 Auth (sessions)                    │
│  - Admin operations (approve, mint, split, symbol)  │
│  - Cap-table viewer with export                     │
└───────────────┬────────────────┬────────────────────┘
                │                │
         [ethers.js]      [Supabase Client]
         (TypeScript)     (TypeScript)
                │                │
                ↓                ↓
┌───────────────────────┐  ┌──────────────────────┐
│  ChainEquity Token    │  │  Supabase           │
│  (Hardhat Network)    │  │  - User Auth        │
│                       │  │  - Sessions         │
│  - ERC-20 + RBAC      │  │  - User Profiles    │
│  - Allowlist gating   │  │                      │
│  - Virtual split      │  │                      │
│  - Mutable symbol     │  │                      │
│                       │  │                      │
│  Events: Transfer,    │  │                      │
│  Mint, Burn, etc.     │  │                      │
└───────────┬───────────┘  └──────────────────────┘
            │
            │ [Query Events]
            │
            ↓
    Cap-Table Export Service
    (TypeScript - Query blockchain directly)
```

**Data Flow**:
1. User connects wallet → Supabase Web3 auth verifies ownership → creates session
2. Admin uses Web UI → checks on-chain role → sends transaction to contract
3. Contract emits events (Transfer, Mint, etc.)
4. Cap-table service queries blockchain events directly
5. Service calculates balances by processing events from deployment block
6. Users can export cap-table at any block height (query events up to that block)

---

## Required Test Scenarios

### Happy Path Tests
- [ ] Approve wallet → Mint tokens → Verify balance
- [ ] Transfer between two approved wallets → SUCCESS
- [ ] Execute 7-for-1 split → All balances × 7, total supply updates
- [ ] Change symbol → Metadata updates, balances unchanged
- [ ] Export cap-table at block N → Verify accuracy
- [ ] Export cap-table at block N+10 → Verify changes reflected

### Failure Tests
- [ ] Transfer from approved to non-approved → FAIL
- [ ] Transfer from non-approved to approved → FAIL
- [ ] Revoke approval → Previously approved wallet can no longer receive
- [ ] Unauthorized wallet attempts admin action → FAIL

---

## Gas Benchmarks (Target)

| Operation | Target Gas | Actual | Notes |
|-----------|-----------|--------|-------|
| Mint tokens | <100k | | |
| Approve wallet | <50k | | |
| Transfer (gated) | <100k | | |
| Revoke approval | <50k | | |
| Stock split (per holder) | Document | | |
| Symbol change | <50k | | |

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

## Critical Path Implementation

**Core Contract Features (Must Have)**
- [ ] ERC-20 base with OpenZeppelin
- [ ] AccessControl with MINTER_ROLE, APPROVER_ROLE
- [ ] Allowlist mapping with transfer validation
- [ ] Virtual split: base balances + multiplier
- [ ] Mutable symbol storage
- [ ] Events: Transfer, Mint, ApprovalUpdated, SplitExecuted, SymbolChanged

**Cap-Table Service (Must Have)**
- [ ] Blockchain event query service
- [ ] Query Transfer, Mint, Burn events from deployment block
- [ ] Calculate balances by processing events
- [ ] Cap-table query function (by block number - query events up to that block)
- [ ] CSV/JSON export function

**Web UI (Must Have)**
- [ ] Vite.js + React project setup (TypeScript)
- [ ] Tailwind CSS configuration and setup
- [ ] MetaMask wallet connection
- [ ] Supabase Web3 authentication integration
- [ ] Admin panel: approve wallet, mint tokens
- [ ] Admin panel: execute split, change symbol
- [ ] Cap-table viewer with export button
- [ ] Transfer test interface
- [ ] Firebase Hosting deployment configuration

**Testing & Demo (Must Have)**
- [ ] Contract tests (all scenarios from brief)
- [ ] Gas report generation
- [ ] End-to-end demo flow script
- [ ] Technical writeup (1-2 pages)

**Stretch Goals (If Time Permits)**
- [ ] Deploy to Sepolia testnet
- [ ] Enhanced UI polish
- [ ] Additional test coverage
- [ ] User profile enhancements (stored in Supabase)

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

## Architecture Decisions

### 1. Chain: Hardhat Network → Sepolia (stretch)
- Primary: Local Hardhat for fast iteration, zero cost
- Stretch: Sepolia testnet for public demo with Etherscan verification

### 2. Stock Split: Virtual Split Pattern
- Store base balances internally
- Apply multiplier (default: 1) in view functions
- Split operation: update multiplier only (zero gas)
- All transfers use base amounts, return values apply multiplier

### 3. Symbol Change: Mutable Storage
- Custom `_symbol` variable (overrides OpenZeppelin default)
- `changeSymbol()` function updates storage
- Single transaction, low gas cost

### 4. Cap-Table Generation: Direct Blockchain Queries
- Query blockchain events directly using ethers.js
- Calculate balances by processing Transfer/Mint/Burn events
- Generate historical snapshots by querying events up to specific block height
- No database required for cap-table - all data sourced from blockchain

### 4a. Authentication: Supabase Web3 Auth
- Supabase handles wallet authentication and session management
- User profiles stored in Supabase (wallet address, session data)
- On-chain role verification for admin functions
- Persistent user sessions across visits

### 5. Access Control: OpenZeppelin RBAC
- Roles: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `APPROVER_ROLE`
- Flexible multi-admin capability
- Grant/revoke roles as needed

### 6. Allowlist: Simple Mapping
- `mapping(address => bool) public allowlist`
- O(1) lookup for transfer validation
- Allowlist state queryable directly from contract

### 7. Demo: Vite.js + React Web UI (TypeScript)
- Vite.js for fast development and optimized builds
- TypeScript for type safety across frontend
- Tailwind CSS (latest version) for modern, responsive styling
- MetaMask wallet connection
- Admin dashboard for all operations
- Cap-table viewer with CSV export
- Firebase Hosting for deployment
- Professional presentation quality

### 8. Authentication: Supabase Web3 Auth
- MetaMask wallet connection via Supabase Web3 authentication
- User signs message to prove wallet ownership
- Supabase creates session and stores user profile
- Admin role checked on-chain (contract RBAC)
- Persistent sessions across visits

---

## Important Constraints

### Must Do
✓ Build core mechanics yourself (no Polymath, Harbor, etc.)
✓ Use standard libraries OK (OpenZeppelin)
✓ Implement gating logic yourself
✓ Include disclaimer: NOT regulatory-compliant
✓ Testnet/devnet only
✓ Environment variables for secrets

### Must Not Do
✗ Use pre-built security token platforms
✗ Make compliance claims
✗ Commit secrets to repo
✗ Use real funds on mainnet

---

## Optional Hard-Mode Add-Ons
(Only if time permits)

- [ ] Multi-sig admin controls
- [ ] Vesting schedules with cliff
- [ ] Partial transfer restrictions (daily limits)
- [ ] Dividend distribution
- [ ] Upgradeable contracts (proxy pattern)
- [ ] Gas optimization challenge (50% reduction)

---

## Success Metrics

| Category | Metric | Target | Status |
|----------|--------|--------|--------|
| Correctness | False-positive transfers | 0 | |
| Correctness | False-negative blocks | 0 | |
| Operability | Cap-table export works | ✓ | |
| Corporate Actions | Split + symbol change | Both work | |
| Performance | Transfer confirmation | Within norms | |
| Performance | Cap-table generation | <30s for typical chain | |
| Documentation | Rationale documented | Clear & justified | |

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