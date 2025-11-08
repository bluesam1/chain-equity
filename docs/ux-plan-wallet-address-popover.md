# UX Plan: Wallet Address Popover Feature

**Created by:** Sally (UX Expert)  
**Date:** 2024  
**Status:** Planning

## Overview

Add a hover-triggered popover component that appears when users hover over any wallet address throughout the application. The popover displays wallet balance, provides copy functionality, and includes a link to view transaction history filtered by that address.

## User Goals

1. **Quick Information Access:** Users want to quickly see wallet balance without navigating away
2. **Efficient Copying:** Users want to copy wallet addresses with minimal clicks
3. **Contextual Navigation:** Users want to jump directly to transaction history for a specific address

## Design Requirements

### Visual Design

**Popover Container:**
- Background: `bg-surface` (dark theme)
- Border: `border border-border` with rounded corners (`rounded-lg`)
- Shadow: `shadow-xl` for depth
- Padding: `p-4` (16px)
- Max width: `max-w-sm` (384px)
- Z-index: High enough to appear above other content (z-50)

**Content Layout:**
```
┌─────────────────────────────┐
│ Wallet Address              │
│ 0x7099...79C8               │
│                             │
│ Balance: 1,234.56 TOK       │
│                             │
│ [📋 Copy Address]           │
│ [View Transaction History →]│
└─────────────────────────────┘
```

**Typography:**
- Address: `font-mono text-sm text-text-primary`
- Balance label: `text-xs text-text-secondary`
- Balance value: `text-lg font-semibold text-text-primary`
- Buttons: Standard button styling from design system

**Spacing:**
- Section spacing: `space-y-3` (12px between sections)
- Button spacing: `gap-2` (8px between buttons)

### Interaction Design

**Trigger:**
- Hover on any wallet address element
- Delay: 300ms before showing (prevents accidental triggers)
- Hide: 200ms after mouse leaves (allows moving to popover)

**Positioning:**
- Position: Above the address by default, adjust if near viewport edge
- Arrow/pointer: Optional small triangle pointing to address
- Smart positioning: Flip to below if near top of viewport

**States:**
- **Loading:** Show skeleton/spinner while fetching balance
- **Loaded:** Display balance with smooth fade-in
- **Error:** Show error message with retry option
- **Empty:** Show "No balance" or "0.00 TOK"

## Component Architecture

### New Components

1. **`WalletAddressPopover`** (New)
   - Location: `frontend/src/components/WalletAddressPopover.tsx`
   - Props:
     - `address: string` (required)
     - `trigger?: React.ReactNode` (optional, defaults to address display)
     - `position?: 'top' | 'bottom' | 'left' | 'right'` (optional)
     - `showOnHover?: boolean` (default: true)
   - Responsibilities:
     - Manage hover state
     - Position popover relative to trigger
     - Fetch and display balance
     - Handle copy functionality
     - Provide navigation link

2. **`useWalletBalance`** (New Hook)
   - Location: `frontend/src/hooks/useWalletBalance.ts`
   - Purpose: Fetch balance for any wallet address (not just connected wallet)
   - Returns:
     - `balance: string | null`
     - `symbol: string | null`
     - `isLoading: boolean`
     - `error: string | null`
     - `refetch: () => void`

### Integration Points

**Components to Update:**

1. **`TransactionRow.tsx`**
   - Wrap "From" and "To" address displays with `WalletAddressPopover`
   - Replace existing copy button with popover copy button
   - Maintain existing click-to-expand functionality (or replace with popover)

2. **`Table.tsx`**
   - Update address cell rendering to use `WalletAddressPopover`
   - Replace inline copy button with popover

3. **`WalletBadge.tsx`**
   - Wrap address display with `WalletAddressPopover`
   - Keep existing functionality, enhance with popover

4. **`Balance.tsx`**
   - Wrap wallet address display with `WalletAddressPopover` (if address is shown)

## Functional Requirements

### FR1: Hover Trigger
- Popover appears on hover over wallet address
- 300ms delay before showing (prevents accidental triggers)
- Popover remains visible when hovering over it
- Popover hides 200ms after mouse leaves both address and popover

### FR2: Balance Display
- Fetch and display token balance for the hovered address
- Show loading state while fetching
- Display balance in formatted format (e.g., "1,234.56 TOK")
- Show token symbol from contract
- Handle errors gracefully with retry option

### FR3: Copy Address
- Copy button in popover copies full address to clipboard
- Show visual feedback (checkmark or "Copied!" message)
- Feedback disappears after 2 seconds

### FR4: Transaction History Link
- Link navigates to Transaction History tab
- Pre-filters by the address
- Uses URL parameter: `?address=0x...`
- Switches to Transaction History tab if not already active

### FR5: Smart Positioning
- Position popover above address by default
- Flip to below if near top of viewport
- Adjust horizontally if near viewport edges
- Ensure popover remains fully visible

### FR6: Performance
- Debounce hover events to prevent excessive API calls
- Cache balance results per address
- Invalidate cache after 30 seconds or on transaction events
- Lazy load balance only when popover is shown

## Technical Implementation

### Balance Fetching

**New Hook: `useWalletBalance`**
```typescript
export function useWalletBalance(address: string) {
  // Uses existing getBalance from lib/contract.ts
  // Fetches balance for any address (not just connected wallet)
  // Returns formatted balance with symbol
}
```

**Implementation Details:**
- Use `getBalance(address, provider)` from `lib/contract.ts`
- Use `getSymbol(provider)` and `getDecimals(provider)` for formatting
- Use `formatBalance(balance, decimals)` for display
- Cache results in component state or context

### Navigation to Transaction History

**Tab Switching:**
- Use `Tabs` component's `onTabChange` callback
- Update `App.tsx` to handle tab switching programmatically
- Or use URL-based approach with hash: `#transaction-history?address=0x...`

**URL Parameter:**
- TransactionHistory already supports `?address=0x...` parameter
- Need to ensure tab switches when URL contains address parameter

### Popover Positioning

**Library Options:**
1. **Custom Implementation:** Use `useRef` and `getBoundingClientRect()` for positioning
2. **Floating UI:** Lightweight positioning library (recommended)
3. **Popper.js:** More features but heavier

**Recommended:** Custom implementation with viewport detection

### Copy Functionality

**Implementation:**
- Use `navigator.clipboard.writeText(address)`
- Show success state with checkmark icon
- Use existing copy pattern from `WalletBadge.tsx`

## User Experience Flow

### Happy Path

1. User hovers over wallet address in TransactionRow
2. After 300ms, popover appears above address
3. Popover shows loading spinner
4. Balance loads and displays: "Balance: 1,234.56 TOK"
5. User can:
   - Click copy button → Address copied, checkmark appears
   - Click "View Transaction History" → Tab switches, filters applied

### Error States

**Network Error:**
- Show error message: "Unable to load balance"
- Show retry button
- Retry refetches balance

**Invalid Address:**
- Don't show popover for invalid addresses
- Validate address before showing popover

**No Balance:**
- Show "Balance: 0.00 TOK" (not an error, just zero)

## Accessibility Considerations

### Keyboard Navigation
- Popover should be accessible via keyboard
- Consider: Focus on address → Press Enter → Popover appears
- Tab navigation within popover
- Escape key closes popover

### Screen Readers
- Announce popover appearance: "Balance popover for address 0x..."
- Announce balance when loaded
- Announce copy success: "Address copied to clipboard"

### ARIA Attributes
- `role="dialog"` or `role="tooltip"` for popover
- `aria-label` for popover content
- `aria-live="polite"` for balance updates
- `aria-describedby` linking address to popover

### Focus Management
- Focus trap within popover when open
- Return focus to trigger when popover closes
- Skip popover in tab order (only accessible via hover or explicit focus)

## Edge Cases & Error Handling

### Edge Cases

1. **Very Long Addresses:** Truncate in popover header, show full in copy
2. **Multiple Popovers:** Only one popover visible at a time
3. **Rapid Hovering:** Debounce to prevent flickering
4. **Viewport Edges:** Smart positioning to keep popover visible
5. **Mobile/Touch:** Consider tap-to-show instead of hover
6. **Slow Network:** Show loading state, allow cancellation
7. **Disconnected Wallet:** Still show balance (read-only operation)

### Error Handling

1. **Balance Fetch Fails:**
   - Show error message
   - Provide retry button
   - Don't block other popover features (copy, link still work)

2. **Copy Fails:**
   - Show error message
   - Fallback: Show address in textarea for manual copy

3. **Navigation Fails:**
   - Fallback: Show address in URL bar for manual navigation
   - Or: Show error toast

## Performance Considerations

### Optimization Strategies

1. **Debouncing:** Debounce hover events (300ms delay)
2. **Caching:** Cache balance results per address
3. **Lazy Loading:** Only fetch balance when popover is shown
4. **Request Cancellation:** Cancel in-flight requests when popover closes
5. **Batch Requests:** If multiple addresses visible, batch balance requests

### Caching Strategy

- Cache balance for 30 seconds per address
- Invalidate cache on:
  - Transfer events (listen to Transfer events)
  - Manual refresh
  - After 30 seconds

## Implementation Phases

### Phase 1: Core Popover Component
- [ ] Create `WalletAddressPopover` component
- [ ] Implement hover trigger with delay
- [ ] Implement smart positioning
- [ ] Add basic styling

### Phase 2: Balance Integration
- [ ] Create `useWalletBalance` hook
- [ ] Integrate balance fetching
- [ ] Add loading and error states
- [ ] Implement caching

### Phase 3: Copy & Navigation
- [ ] Implement copy functionality
- [ ] Add copy success feedback
- [ ] Implement transaction history navigation
- [ ] Handle tab switching

### Phase 4: Integration
- [ ] Integrate into `TransactionRow`
- [ ] Integrate into `Table` component
- [ ] Integrate into `WalletBadge`
- [ ] Test all integration points

### Phase 5: Polish & Accessibility
- [ ] Add keyboard navigation
- [ ] Add ARIA attributes
- [ ] Add screen reader support
- [ ] Test with assistive technologies
- [ ] Performance optimization

## Success Metrics

1. **Usability:** Users can view balance without leaving current context
2. **Efficiency:** Copy address in 1 click instead of 2
3. **Navigation:** Direct link to filtered transaction history
4. **Performance:** Popover appears within 300ms, balance loads within 2 seconds
5. **Accessibility:** Works with keyboard and screen readers

## Design Decisions

### Decision 1: Hover vs Click
**Decision:** Hover with 300ms delay  
**Rationale:** Faster access, less intrusive, follows common UI patterns

### Decision 2: Popover vs Modal
**Decision:** Popover  
**Rationale:** Non-intrusive, doesn't block other interactions, quick information access

### Decision 3: Balance Caching
**Decision:** 30-second cache with event invalidation  
**Rationale:** Reduces API calls, improves performance, balance updates on relevant events

### Decision 4: Navigation Method
**Decision:** Programmatic tab switching + URL parameter  
**Rationale:** Seamless UX, supports deep linking, maintains browser history

## Open Questions

1. **Mobile Support:** Should popover work on touch devices? (Tap to show?)
2. **Balance Refresh:** Should balance auto-refresh while popover is open?
3. **Multiple Addresses:** Should we show popover for contract addresses too?
4. **Block Explorer:** Should we add link to block explorer in popover?

## Next Steps

1. Review this plan with development team
2. Get approval on design decisions
3. Create detailed component specifications
4. Begin Phase 1 implementation
5. User testing after Phase 3

---

**Document Status:** Ready for Review  
**Next Review:** After implementation begins


