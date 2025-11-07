# Epic 5: Web UI

## Overview

Vite.js + React web interface with MetaMask integration, Supabase authentication, and admin dashboard.

## 📋 Required Documentation

**⚠️ CRITICAL: Before starting development, read the Front-End Specification**

- **[Front-End Specification](../front-end-spec.md)** - Complete UI/UX specification including:
  - User flows and interaction patterns
  - Component library and design system
  - Color palette and typography
  - Network configuration (dev-net only)
  - Accessibility requirements
  - Responsiveness strategy
  - Animation and micro-interactions

**All UI implementation must follow the front-end specification.**

---

## Operator Demo (CLI or UI)

### Demo Flow Requirements

- [ ] Mint tokens to approved wallet → SUCCESS
- [ ] Transfer between two approved wallets → SUCCESS
- [ ] Transfer to non-approved wallet → BLOCKED
- [ ] Approve new wallet → Transfer now succeeds
- [ ] Execute 7-for-1 split → Balances multiply by 7
- [ ] Change ticker symbol → Symbol updates, balances unchanged
- [ ] Export cap-table at specific block

---

## Web UI Implementation Checklist

### Web UI (Must Have)

- [ ] **Read and understand Front-End Specification** (`docs/front-end-spec.md`)
- [ ] Vite.js + React project setup (TypeScript)
- [ ] Tailwind CSS configuration and setup (using dark theme colors from spec)
- [ ] Implement component library per design system specification
- [ ] MetaMask wallet connection (following user flow in spec)
- [ ] Network configuration (dev-net only - Hardhat local, Chain ID 31337)
- [ ] Supabase Web3 authentication integration
- [ ] Admin panel: approve wallet, mint tokens (following admin flows in spec)
- [ ] Admin panel: execute split, change symbol (following corporate actions flows)
- [ ] Cap-table viewer with export button (following cap table flow in spec)
- [ ] Transfer test interface (following transfer flow in spec)
- [ ] Implement all user flows per specification
- [ ] Verify accessibility requirements (WCAG 2.1 AA)
- [ ] Firebase Hosting deployment configuration

### Design System Implementation

- [ ] Implement color palette from specification (dark theme)
- [ ] Configure typography scale per specification
- [ ] Implement all 8 core components per component library
- [ ] Apply spacing and layout guidelines
- [ ] Implement animation and micro-interactions per specification
- [ ] Verify responsive breakpoints per specification

## Developer Handoff Checklist

Before starting Epic 5 development, ensure:

1. ✅ **Read Front-End Specification** (`docs/front-end-spec.md`)
   - Review all user flows
   - Understand component library requirements
   - Note color palette and typography specifications
   - Understand network configuration (dev-net only)

2. ✅ **Review Design System**
   - Component variants and states
   - Usage guidelines for each component
   - Dark theme color palette
   - Typography scale

3. ✅ **Understand User Flows**
   - Wallet Connection & Authentication
   - Transfer Tokens
   - Admin: Approve Wallet
   - Admin: Mint Tokens
   - Admin: Execute Split
   - Admin: Change Symbol
   - Export Cap Table

4. ✅ **Network Configuration**
   - Only dev-net (Hardhat local) supported
   - Chain ID: 31337
   - Network validation required before transactions
   - Network indicator in UI

5. ✅ **Accessibility Requirements**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Color contrast ratios

**All UI implementation must align with the front-end specification.**

