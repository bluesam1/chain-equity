# Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js 18.x or later
- npm 9.x or later
- MetaMask browser extension

**Initial Setup:**
```bash
# Clone repository
git clone <repo-url>
cd chain-equity

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys

# Start Hardhat network (Terminal 1)
npx hardhat node

# Deploy contracts (Terminal 2)
npx hardhat run scripts/deploy.ts --network localhost

# Start frontend (Terminal 3)
cd frontend
npm install
npm install -D tailwindcss@latest @tailwindcss/vite
# Add @tailwindcss/vite plugin to vite.config.ts
# Add @import "tailwindcss"; to src/index.css
npm run dev  # Vite dev server runs on http://localhost:5173
```

**Development Commands:**
```bash
# Compile contracts
npx hardhat compile

# Run contract tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost

# Start frontend (Vite dev server)
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Generate cap-table (from backend directory, TypeScript)
cd backend && npm run build
node dist/cap-table.js
```

### Environment Configuration

**Required Environment Variables:**

**Frontend (.env.local):**
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CONTRACT_ADDRESS=deployed-contract-address
VITE_RPC_URL=http://localhost:8545
```

**Note:** Vite uses `VITE_` prefix for environment variables instead of `NEXT_PUBLIC_`.

**Tailwind CSS v4 Setup:**
Tailwind CSS v4 uses the Vite plugin and doesn't require a config file. After installing Tailwind:

1. Add the plugin to `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

2. Add the import to `src/index.css`:
```css
@import "tailwindcss";
```

**Note:** Tailwind CSS v4 uses a high-performance engine and modern CSS features. No `tailwind.config.js` or `postcss.config.js` files are needed when using the Vite plugin.

**Backend (.env):**
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
PRIVATE_KEY=your-wallet-private-key
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=deployed-contract-address
```

**Shared:**
- Contract address (same for frontend and backend)
- RPC URL (same network for both)

---

