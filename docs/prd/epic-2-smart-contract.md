# Epic 2: Core Smart Contract

## Overview

ERC-20 token contract with allowlist transfer restrictions, RBAC, virtual split, and mutable symbol.

---

## Gated Token Contract Requirements

- [ ] ERC-20 standard token implementation
- [ ] Allowlist mechanism for transfer restrictions
- [ ] Transfer validation: check BOTH sender AND recipient on allowlist
- [ ] Revert transfers if either party not approved
- [ ] Admin functions: add/remove from allowlist, mint tokens
- [ ] Events: Transfer, Approval, AllowlistUpdate, Mint

---

## Contract Implementation Checklist

### Core Contract Features (Must Have)

- [ ] ERC-20 base with OpenZeppelin
- [ ] AccessControl with MINTER_ROLE, APPROVER_ROLE
- [ ] Allowlist mapping with transfer validation
- [ ] Virtual split: base balances + multiplier
- [ ] Mutable symbol storage
- [ ] Events: Transfer, Mint, ApprovalUpdated, SplitExecuted, SymbolChanged

