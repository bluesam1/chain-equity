# Epic 1: Project Foundation

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

