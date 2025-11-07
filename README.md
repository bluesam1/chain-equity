# Chain Equity

A blockchain-based equity management platform for tokenized securities.

## Overview

Chain Equity is a tokenized security prototype that demonstrates on-chain equity management with compliance gating, corporate actions, and cap-table management. The platform enables secure, compliant trading of tokenized securities with transfer restrictions, automated corporate actions, and real-time cap-table tracking.

### Key Features

- **Gated Token Transfers**: ERC-20 token with allowlist mechanism - only approved wallets can trade
- **Corporate Actions**: Virtual stock splits (7-for-1) and mutable symbol changes
- **Cap-Table Management**: Real-time ownership tracking and historical snapshots at any block height
- **Role-Based Access Control**: Admin controls for allowlist management and token minting
- **Web3 Authentication**: Supabase Web3 auth for secure wallet-based authentication
- **Production-Ready UI**: Modern React frontend with MetaMask integration

### Project Goals

- Demonstrate on-chain compliance gating for tokenized securities
- Provide a production-quality prototype for equity management
- Enable real-time cap-table tracking and historical queries
- Support corporate actions (splits, symbol changes) on-chain
- Deliver a complete end-to-end solution from smart contracts to web interface

## Tech Stack

### Blockchain & Smart Contracts
- **Solidity** 0.8.x - Smart contract development
- **Hardhat** ^2.x - Development framework, testing, and deployment
- **OpenZeppelin** ^5.0.0 - ERC-20 base and AccessControl for RBAC
- **ethers.js** ^6.x - Blockchain interaction (frontend and backend)

### Frontend
- **Vite.js** ^5.x - Build tool and development server
- **React** ^18.x - UI framework
- **TypeScript** ^5.x - Type safety
- **Tailwind CSS** ^4.x - Utility-first styling
- **wagmi** ^2.x - Web3 React hooks for MetaMask integration

### Backend & Authentication
- **Supabase Web3 Auth** ^2.x - User authentication and session management
- **Node.js** - Backend runtime
- **TypeScript** ^5.x - Type safety

### Development Tools
- **npm** - Package manager with workspaces
- **Hardhat Test** ^2.x - Contract testing framework

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- MetaMask browser extension (for frontend)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repo-url>
cd chain-equity
```

### 2. Install Dependencies

**One-Command Setup** (recommended):

```bash
# Install all dependencies for all workspaces (root, contracts, backend, frontend)
npm install
```

This single command installs dependencies for all workspaces in the monorepo:
- Root workspace dependencies
- Contracts workspace dependencies
- Backend workspace dependencies
- Frontend workspace dependencies

**Manual Installation** (if needed):

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..

# Install contract dependencies
cd contracts
npm install
cd ..
```

### 3. Set Up Environment Variables

#### Root Environment Variables

Copy the root `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

- **SUPABASE_URL**: Get from your Supabase project dashboard at https://app.supabase.com
- **SUPABASE_ANON_KEY**: Get from your Supabase project dashboard
- **RPC_URL**: For local development, use `http://localhost:8545` (Hardhat default)
- **PRIVATE_KEY**: Your wallet private key for contract deployment (NEVER commit this)
- **CONTRACT_ADDRESS**: Will be populated after contract deployment

#### Frontend Environment Variables

Copy the frontend `.env.local.example` file to `.env.local`:

```bash
cd frontend
cp .env.local.example .env.local
cd ..
```

Edit `frontend/.env.local` with your actual values:

- **VITE_SUPABASE_URL**: Same as SUPABASE_URL in root `.env`
- **VITE_SUPABASE_ANON_KEY**: Same as SUPABASE_ANON_KEY in root `.env`
- **VITE_RPC_URL**: Same as RPC_URL in root `.env`
- **VITE_CONTRACT_ADDRESS**: Same as CONTRACT_ADDRESS in root `.env`

**Important**: Vite requires the `VITE_` prefix for environment variables that should be exposed to the frontend code.

### 4. Start Local Development

#### Terminal 1: Start Hardhat Network

```bash
cd contracts
npx hardhat node
```

#### Terminal 2: Deploy Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed contract address and update it in both `.env` and `frontend/.env.local`.

#### Terminal 3: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

## Project Structure

This is a monorepo using npm workspaces for dependency management. The project is organized into three main workspaces:

```
chain-equity/
├── contracts/          # Smart contracts workspace
│   ├── src/            # Solidity source files
│   ├── test/           # Hardhat test files
│   ├── scripts/        # Deployment and utility scripts
│   ├── hardhat.config.ts
│   └── package.json
├── frontend/           # React + Vite frontend workspace
│   ├── src/            # React source files
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities (Supabase, etc.)
│   │   └── pages/      # Page components
│   ├── public/         # Static assets
│   ├── dist/           # Production build output
│   ├── vite.config.ts
│   └── package.json
├── backend/            # TypeScript backend services workspace
│   ├── src/            # TypeScript source files
│   │   ├── cap-table.ts
│   │   ├── issuer.ts
│   │   └── utils/
│   ├── dist/           # Compiled JavaScript output
│   └── package.json
├── docs/               # Documentation
│   ├── architecture/  # Architecture documentation
│   ├── prd/           # Product requirements
│   └── stories/       # Development stories
├── .env.example        # Root environment variables template
├── firebase.json       # Firebase Hosting configuration
├── .firebaserc         # Firebase project configuration
├── package.json        # Root package.json with workspace configuration
└── README.md           # This file
```

### Workspace Structure

- **contracts/**: Hardhat project for smart contract development, testing, and deployment
- **frontend/**: Vite + React application with TypeScript, Tailwind CSS, and Web3 integration
- **backend/**: TypeScript backend services for cap-table management and issuer operations
- **docs/**: Comprehensive project documentation including architecture, PRD, and development stories

### Key Directories

- **contracts/src/**: Solidity smart contract source files
- **frontend/src/**: React application source code
- **frontend/dist/**: Production build output (deployed to Firebase Hosting)
- **backend/src/**: Backend service source code
- **docs/architecture/**: System architecture and technical documentation

## Development Commands

### Contracts

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

### Frontend

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend

```bash
cd backend

# Build TypeScript
npm run build

# Run compiled JavaScript
npm run start

# Watch mode for development
npm run dev
```

## Environment Variables

### Security Notes

- **NEVER commit `.env` or `.env.local` files** - they contain sensitive information
- Always use `.env.example` files as templates
- Keep your private keys secure and never share them
- Use different keys for development and production environments

### Setting Up Supabase

#### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in project details:
   - **Name**: Chain Equity (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Select a region close to your users
5. Click "Create new project" and wait for provisioning (takes 1-2 minutes)

#### 2. Enable Web3 Authentication

1. In your Supabase project dashboard, navigate to **Authentication** > **Providers**
2. Scroll down to find **Web3** provider
3. Click on **Web3** to expand settings
4. Enable the Web3 provider by toggling it on
5. Configure Web3 authentication settings:
   - **Enable Web3**: Toggle ON
   - **Message Template**: Use default or customize the message users will sign
6. Click "Save" to apply changes

**Note**: Supabase Web3 authentication allows users to authenticate using their wallet by signing a message. The signature is verified by Supabase, and a session is created.

#### 3. Obtain Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Find the **Project URL** section and copy the URL (e.g., `https://xxxxx.supabase.co`)
3. Find the **Project API keys** section and copy the **anon/public** key
4. Add these values to your environment variables:
   - Add to root `.env`: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Add to `frontend/.env.local`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

#### 4. Verify Supabase Client Initialization

The Supabase client is initialized in `frontend/src/lib/supabase.ts`. To verify it's working:

1. Ensure your environment variables are set correctly
2. Start the frontend: `cd frontend && npm run dev`
3. Check the browser console for any Supabase connection errors
4. The client should initialize automatically when imported

### Web3 Authentication Flow

The application uses Supabase Web3 authentication with the following flow:

1. **User connects wallet** (via MetaMask or other Web3 wallet)
2. **User signs message** - A message is generated and the user signs it with their wallet
3. **Signature verification** - Supabase verifies the signature matches the wallet address
4. **Session creation** - Supabase creates a session and stores user profile
5. **Persistent sessions** - Sessions persist across browser sessions using Supabase's session management

**Key Points:**
- Users authenticate by signing a message (no password required)
- Supabase handles signature verification and session management
- User profiles are stored in Supabase (wallet address, session data)
- Admin roles are verified on-chain (contract RBAC), not in Supabase

For more details, see:
- [Supabase Web3 Auth Documentation](https://supabase.com/docs/guides/auth/web3)
- [Supabase Authentication Guide](https://supabase.com/docs/guides/auth)

### RPC URLs

- **Local Development**: `http://localhost:8545` (Hardhat default)
- **Production**: Use a reliable RPC provider like:
  - Infura: https://infura.io
  - Alchemy: https://www.alchemy.com
  - Public RPC endpoints (less reliable)

## Firebase Hosting Setup

### Prerequisites

- Firebase CLI installed globally: `npm install -g firebase-tools`
- Firebase account (sign up at https://firebase.google.com)

### 1. Install and Authenticate Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Authenticate with Firebase
firebase login

# Verify authentication
firebase projects:list
```

### 2. Initialize Firebase Project

```bash
# In the repository root directory
firebase init hosting
```

During initialization:
1. Select or create a Firebase project
2. When asked for the public directory, enter: `frontend/dist`
3. Configure as a single-page app: **Yes** (for React routing)
4. Set up automatic builds and deploys with GitHub: **No** (optional, can be configured later)
5. Overwrite `index.html`: **No** (Vite generates this)

**Note**: The `firebase.json` and `.firebaserc` files are already configured. If you run `firebase init hosting`, you may need to update `.firebaserc` with your actual Firebase project ID.

### 3. Configure Firebase Project ID

After initializing, update `.firebaserc` with your Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

### 4. Build and Deploy

```bash
# From repository root - builds frontend and deploys to Firebase
npm run deploy
```

Or manually:

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Deploy to Firebase
firebase deploy
```

### 5. Verify Deployment

After deployment, Firebase will provide a hosting URL like:
```
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
```

Visit the URL to verify your application is live.

### Deployment Process

The deployment process:
1. **Build**: Compiles TypeScript and builds production bundle to `frontend/dist/`
2. **Deploy**: Uploads `frontend/dist/` contents to Firebase Hosting
3. **CDN**: Firebase automatically distributes your app via global CDN

### Firebase Hosting Configuration

The `firebase.json` file is configured with:
- **Public directory**: `frontend/dist` (Vite build output)
- **Rewrites**: All routes redirect to `index.html` (for React Router)
- **Caching**: Static assets cached for 1 year, HTML files not cached

### Manual Testing Before Deployment

Test your production build locally before deploying:

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` to preview the production build.

## Documentation

- [Product Requirements Document (PRD)](docs/PRD.md)
- [Architecture Documentation](docs/architecture/)
- [Development Workflow](docs/architecture/development-workflow.md)

## License

[Add your license here]

