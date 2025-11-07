# Epic 3: Backend Services

## Overview

Backend services for issuer operations and cap-table generation.

---

## Issuer Service (Backend/CLI)

### Requirements

- [ ] Approve/deny wallet addresses (KYC mock)
- [ ] Submit allowlist updates to contract
- [ ] Mint tokens to approved wallets
- [ ] Query allowlist status
- [ ] Trigger corporate actions
- [ ] Implementation: Node.js/Python + web3 library

---

## Cap-Table Export

### Requirements

- [ ] Query blockchain directly for Transfer, Mint, Burn events
- [ ] Calculate balances by processing events from deployment block
- [ ] Calculate ownership percentages using BigNumber division (avoid JavaScript number precision loss)
- [ ] Format percentages as strings with fixed decimal precision (6-8 decimals)
- [ ] Generate "as-of block" snapshots by querying events up to specific block height
- [ ] Export cap-table in CSV/JSON format
- [ ] Include: wallet address, balance, ownership % (as string to preserve precision)
- [ ] Query historical cap-table at any block height
- [ ] Note: Percentages may not sum to exactly 100% due to rounding (document this)

---

## Backend Implementation Checklist

### Cap-Table Service (Must Have)

- [ ] Blockchain event query service
- [ ] Query Transfer, Mint, Burn events from deployment block
- [ ] Calculate balances by processing events
- [ ] Cap-table query function (by block number - query events up to that block)
- [ ] CSV/JSON export function

