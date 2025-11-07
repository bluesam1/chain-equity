# Backend Architecture

### Service Architecture

**Service Organization:**
```
backend/
├── src/
│   ├── cap-table.ts          # Cap-table generation service (TypeScript)
│   ├── issuer.ts             # Issuer service (admin operations) (TypeScript)
│   └── utils/
│       ├── provider.ts       # Blockchain provider setup (TypeScript)
│       └── events.ts         # Event query utilities (TypeScript)
├── tsconfig.json             # TypeScript configuration
└── package.json
```

**Service Template:**
```typescript
// backend/src/cap-table.ts
import { ethers } from 'ethers';
import { getProvider } from './utils/provider';
import type { CapTable, TokenHolder } from './types';

export async function generateCapTable(
  contractAddress: string,
  blockNumber: number | null = null
): Promise<CapTable> {
  const provider = getProvider();
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  
  // Query events from deployment block to target block
  const events = await queryTransferEvents(contract, blockNumber);
  
  // Calculate balances
  const balances = calculateBalances(events);
  
  return formatCapTable(balances);
}
```

### Cap-Table Service Architecture

**Cap-Table Generation Flow:**

1. **Query Deployment Block:**
   - Get contract deployment transaction
   - Extract deployment block number

2. **Query Events:**
   - Query `Transfer` events from deployment block to target block
   - Query `Mint` events
   - Query `Burn` events (if implemented)

3. **Calculate Balances:**
   - Process events chronologically
   - Track balance changes per address
   - Apply multiplier if querying current state

4. **Calculate Ownership Percentages:**
   - Formula: `(balance * 100 * precision) / totalSupply` where precision = 1e6 for 6 decimal places
   - This gives: `(balance * 100 * 1e6) / totalSupply` = percentage scaled by 1e6
   - Format as decimal string with 6 decimal places using `formatUnits(value, 6)`
   - Sum all percentages and note rounding discrepancy if not exactly 100%

5. **Format Output:**
   - Format as CSV or JSON
   - Include metadata (block number, timestamp)
   - Include rounding note if percentages don't sum to exactly 100%

**Event Query Implementation:**
```typescript
async function queryTransferEvents(
  contract: ethers.Contract,
  toBlock: number | null = null
): Promise<ethers.EventLog[]> {
  const filter = contract.filters.Transfer();
  const events = await contract.queryFilter(filter, deploymentBlock, toBlock);
  return events;
}
```

**Ownership Percentage Calculation (Avoiding Rounding Issues):**
```typescript
import { ethers } from 'ethers';

function calculateOwnershipPercentage(
  balance: ethers.BigNumberish,
  totalSupply: ethers.BigNumberish
): string {
  const balanceBN = ethers.BigNumber.from(balance);
  const totalSupplyBN = ethers.BigNumber.from(totalSupply);
  
  // Formula: (balance / totalSupply) * 100
  // To avoid precision loss, we scale up before division:
  // (balance * 100 * 1e6) / totalSupply = percentage * 1e6
  const PRECISION = ethers.BigNumber.from(10).pow(6); // 6 decimal places
  const percentageScaled = balanceBN
    .mul(100)                    // Convert to percentage
    .mul(PRECISION)              // Scale for 6 decimal precision
    .div(totalSupplyBN);         // Divide by total supply
  
  // Format as decimal string: percentageScaled / 1e6
  // Example: 10000000 / 1e6 = "10.000000" (10%)
  const percentage = ethers.utils.formatUnits(percentageScaled, 6);
  
  return percentage;
}

// Example: balance = 1000, totalSupply = 10000
// Step 1: (1000 * 100 * 1e6) / 10000 = 10000000
// Step 2: formatUnits(10000000, 6) = "10.000000"
// Result: "10.000000" (10%)
```

### Issuer Service Architecture

**Issuer Service Functions:**
- `approveWallet(address)` - Add wallet to allowlist
- `revokeWallet(address)` - Remove wallet from allowlist
- `mintTokens(address, amount)` - Mint tokens to address
- `executeSplit(multiplier)` - Execute stock split
- `changeSymbol(newSymbol)` - Change token symbol

**Implementation Pattern:**
```typescript
async function approveWallet(
  contract: ethers.Contract,
  walletAddress: string,
  signer: ethers.Signer
): Promise<string> {
  const tx = await contract.connect(signer).approveWallet(walletAddress);
  await tx.wait();
  return tx.hash;
}
```

---
