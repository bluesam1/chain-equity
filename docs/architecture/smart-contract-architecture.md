# Smart Contract Architecture

### Contract Structure

**Contract Name:** `ChainEquityToken`

**Inheritance Hierarchy:**
```
ERC20 (OpenZeppelin)
  └── AccessControl (OpenZeppelin)
      └── ChainEquityToken (Custom)
```

**Key Components:**

1. **ERC-20 Base Functionality**
   - Standard token transfers
   - Balance queries
   - Approval mechanism

2. **AccessControl Integration**
   - `DEFAULT_ADMIN_ROLE`: Full contract control
   - `MINTER_ROLE`: Can mint new tokens
   - `APPROVER_ROLE`: Can modify allowlist

3. **Allowlist Mechanism**
   - `mapping(address => bool) public allowlist`
   - Transfer override to check both sender and recipient
   - Admin functions to add/remove addresses

4. **Virtual Split Implementation**
   - `uint256 private _multiplier` (default: 1)
   - Base balances stored internally
   - View functions apply multiplier
   - Split operation updates multiplier only

5. **Mutable Symbol**
   - Custom `_symbol` variable (overrides OpenZeppelin)
   - `changeSymbol()` function for updates

### Contract Events

```solidity
event AllowlistUpdated(address indexed account, bool approved);
event SplitExecuted(uint256 newMultiplier, uint256 blockNumber);
event SymbolChanged(string oldSymbol, string newSymbol);
// Standard ERC-20 events: Transfer, Approval
```

### Contract Functions

**Public/External Functions:**
- `transfer(address to, uint256 amount)` - Overridden with allowlist check
- `transferFrom(address from, address to, uint256 amount)` - Overridden with allowlist check
- `balanceOf(address account)` - Returns balance with multiplier applied
- `totalSupply()` - Returns total supply with multiplier applied
- `symbol()` - Returns current symbol
- `allowlist(address account)` - View allowlist status

**Admin Functions (Role-Gated):**
- `mint(address to, uint256 amount)` - Mint tokens (MINTER_ROLE)
- `approveWallet(address account)` - Add to allowlist (APPROVER_ROLE)
- `revokeWallet(address account)` - Remove from allowlist (APPROVER_ROLE)
- `executeSplit(uint256 newMultiplier)` - Execute stock split (DEFAULT_ADMIN_ROLE)
- `changeSymbol(string memory newSymbol)` - Change token symbol (DEFAULT_ADMIN_ROLE)

---
