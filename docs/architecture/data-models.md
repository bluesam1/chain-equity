# Data Models

### Token Ownership Model

**Purpose:** Represents token ownership and balance information for cap-table generation.

**Key Attributes:**
- `walletAddress`: `address` - Ethereum wallet address of token holder
- `balance`: `uint256` - Current token balance (with multiplier applied)
- `baseBalance`: `uint256` - Base balance before multiplier (internal contract state)
- `ownershipPercentage`: `string` - Percentage of total supply owned (as string to preserve precision)
- `isAllowlisted`: `boolean` - Whether wallet is on the allowlist

**TypeScript Interface:**
```typescript
interface TokenHolder {
  walletAddress: string;
  balance: string; // BigNumber as string (no precision loss)
  baseBalance: string; // BigNumber as string (no precision loss)
  ownershipPercentage: string; // Percentage as string with decimals (e.g., "12.345678") to avoid rounding
  isAllowlisted: boolean;
}

interface CapTable {
  holders: TokenHolder[];
  totalSupply: string;
  blockNumber: number;
  timestamp: number;
}
```

**Relationships:**
- One-to-many: One contract can have many token holders
- Derived from: Transfer, Mint, Burn events on the blockchain

### User Session Model

**Purpose:** Represents authenticated user sessions managed by Supabase.

**Key Attributes:**
- `id`: `uuid` - Supabase user ID
- `walletAddress`: `string` - Ethereum wallet address
- `sessionToken`: `string` - Supabase session token
- `createdAt`: `timestamp` - Session creation time
- `expiresAt`: `timestamp` - Session expiration time

**TypeScript Interface:**
```typescript
interface UserSession {
  id: string;
  walletAddress: string;
  sessionToken: string;
  createdAt: Date;
  expiresAt: Date;
}
```

**Relationships:**
- Managed by: Supabase Web3 Auth
- Linked to: On-chain wallet address for role verification

### Contract State Model

**Purpose:** Represents the current state of the smart contract.

**Key Attributes:**
- `contractAddress`: `address` - Deployed contract address
- `symbol`: `string` - Token symbol (mutable)
- `name`: `string` - Token name
- `totalSupply`: `string` - Total token supply (BigNumber as string)
- `multiplier`: `string` - Current split multiplier (BigNumber as string, could be large)
- `allowlistCount`: `number` - Number of allowlisted addresses

**TypeScript Interface:**
```typescript
interface ContractState {
  contractAddress: string;
  symbol: string;
  name: string;
  totalSupply: string; // BigNumber as string
  multiplier: string; // BigNumber as string (could be large)
  allowlistCount: number;
}
```

**Relationships:**
- Queried directly from: Smart contract view functions
- Updated by: Corporate actions (split, symbol change)

---
