# Coding Standards

### Critical Fullstack Rules

- **Contract Interactions:** Always use ethers.js v6 API, never mix v5 and v6
- **Error Handling:** All contract calls must handle revert reasons and display user-friendly messages
- **Type Safety:** Use TypeScript for frontend, validate contract ABIs match deployed contracts
- **Environment Variables:** Never commit `.env` files, use `.env.example` as template
- **Wallet Connection:** Always check wallet connection before contract interactions
- **Role Verification:** Always verify on-chain roles before showing admin UI
- **Event Queries:** Use block ranges for event queries to avoid timeouts
- **BigNumber Handling:** Always use ethers.js BigNumber utilities, never convert to number for large values
- **Ownership Percentage Calculation:** Use formula `(balance * 100 * 1e6) / totalSupply` with BigNumber, then format using `formatUnits(value, 6)` to get percentage string with 6 decimal places. Never use JavaScript number division.
- **Rounding Strategy:** Use fixed 6 decimal precision for all percentages. Sum all percentages and note if they don't equal exactly 100% due to rounding (this is expected and acceptable).

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `AdminPanel.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| Functions | camelCase | camelCase | `generateCapTable()` |
| Constants | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `CONTRACT_ADDRESS` |
| Contract Functions | camelCase | camelCase | `approveWallet()` |

---
