# Frontend Architecture

### Component Architecture

**Component Organization:**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.tsx              # Home page (TypeScript)
│   │   ├── Admin.tsx             # Admin dashboard (TypeScript)
│   │   └── CapTable.tsx          # Cap-table viewer (TypeScript)
│   ├── components/
│   │   ├── WalletConnection.tsx  # MetaMask connection (TypeScript)
│   │   ├── AdminPanel.tsx        # Admin operations (TypeScript)
│   │   ├── CapTableViewer.tsx    # Cap-table display (TypeScript)
│   │   └── TransactionStatus.tsx # Transaction feedback (TypeScript)
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (TypeScript)
│   │   ├── contract.ts           # Contract interaction utilities (TypeScript)
│   │   ├── capTable.ts          # Cap-table generation (TypeScript)
│   │   └── auth.ts               # Authentication helpers (TypeScript)
│   ├── hooks/
│   │   ├── useAuth.ts            # Authentication hook (TypeScript)
│   │   ├── useContract.ts        # Contract interaction hook (TypeScript)
│   │   └── useCapTable.ts        # Cap-table query hook (TypeScript)
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── styles/
│   │   └── index.css             # Tailwind CSS imports
│   └── main.tsx                  # Vite entry point
├── vite.config.ts                # Vite configuration (includes @tailwindcss/vite plugin)
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

**Component Template:**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useContract } from '@/hooks/useContract';

export default function AdminPanel() {
  const { user, session } = useAuth();
  const { contract, isAdmin } = useContract();
  
  // Component logic
}
```

### State Management Architecture

**State Structure:**
- **Authentication State:** Managed by Supabase client (session, user)
- **Wallet State:** Managed by wagmi hooks (connection, account, chain)
- **Contract State:** Managed by custom hooks (contract instance, roles)
- **UI State:** React useState for local component state

**State Management Patterns:**
- Supabase session state via `@supabase/supabase-js` client
- wagmi hooks for wallet connection state
- Custom React hooks for contract interactions
- Context API for global app state (if needed)

### Routing Architecture

**Route Organization:**
```
/                    # Home - wallet connection (React Router)
/admin               # Admin dashboard (protected route)
/cap-table           # Cap-table viewer
```

**Note:** Using React Router for client-side routing in Vite.js application (TypeScript).

**Protected Route Pattern:**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function ProtectedPage() {
  const { session, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!session) {
    return <Navigate to="/" replace />;
  }
  
  return <PageContent />;
}
```

### Frontend Services Layer

**API Client Setup:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

**Service Example:**
```typescript
// lib/contract.ts
import { ethers } from 'ethers';
import { ChainEquityTokenABI } from '@/abis/ChainEquityToken';

export async function getContractInstance(
  provider: ethers.Provider,
  contractAddress: string
) {
  return new ethers.Contract(
    contractAddress,
    ChainEquityTokenABI,
    provider
  );
}
```

---

