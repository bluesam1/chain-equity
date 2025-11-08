# Transaction History Screen - Product Requirements Document

## Goals and Background Context

### Goals

- Enable users to view all transactions (sends, receives, mints, burns, splits) in chronological order
- Provide wallet address filtering to view transactions for specific addresses
- Visually link related send/receive transaction pairs to show the flow of tokens
- Enable clickable addresses that navigate to the transaction history with that address pre-selected
- Display transaction types clearly (Transfer, Mint, Burn, Split, etc.)
- Show transaction timeline with timestamps and block numbers
- Support infinite scroll with pagination for handling tens of thousands of transactions
- Export transaction history to CSV format for external analysis
- Only display confirmed on-chain transactions (no pending transactions)

### Background Context

Chain Equity currently provides tokenized equity management with gated transfers, corporate actions, and cap-table tracking. Users can view balances and perform transactions, but there's no unified view of transaction history. Users need to:
- Track token movements over time
- Understand transaction relationships (e.g., a send from Wallet A corresponds to a receive in Wallet B)
- Quickly navigate to see all activity for a specific wallet address
- Audit transaction history for compliance and transparency
- Export transaction data for external analysis and reporting

This feature adds transaction history visibility, improving transparency and user experience by making on-chain activity accessible and navigable. The system must handle large transaction volumes (tens of thousands) efficiently through pagination and infinite scroll patterns.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-12-19 | 1.0 | Initial PRD creation for Transaction History Screen | John (PM) |

---

## Requirements

### Functional

FR1: The system shall display all on-chain transactions in chronological order (newest first by default, with option to reverse).

FR2: The system shall query and display the following transaction types:
- Transfer (send/receive between wallets)
- Mint (token creation, identified by Transfer event with from = zero address)
- Burn (token destruction, identified by Transfer event with to = zero address)
- Split (corporate action, identified by SplitExecuted event)
- Symbol Change (corporate action, identified by SymbolChanged event)
- Allowlist Update (identified by AllowlistUpdated event)

FR3: Each transaction entry shall display:
- Transaction hash (clickable link to block explorer if available)
- Transaction type (Transfer, Mint, Burn, Split, Symbol Change, Allowlist Update)
- Block number
- Timestamp (converted from block number)
- From address (if applicable)
- To address (if applicable)
- Amount/value (if applicable)
- Event-specific details (e.g., split multiplier, old/new symbol, allowlist status)

FR4: The system shall provide a wallet address filter that allows users to view transactions where a specific address is involved (as sender, receiver, or both).

FR5: The system shall visually link related send and receive transactions by:
- Grouping Transfer transactions that share the same transaction hash
- Using visual indicators (e.g., connecting lines, matching colors, or grouping) to show that a send from Wallet A corresponds to a receive in Wallet B
- Displaying paired transactions in close proximity when possible

FR6: All wallet addresses displayed in the transaction history shall be clickable, and clicking an address shall navigate to the transaction history screen with that wallet address pre-selected in the filter.

FR7: The system shall implement infinite scroll with pagination:
- Load transactions in pages (e.g., 50 transactions per page)
- Automatically load next page when user scrolls near bottom
- Display loading indicator while fetching next page
- Support manual "Load More" button as alternative to infinite scroll

FR8: The system shall handle large transaction volumes (tens of thousands) efficiently:
- Query events in batches from blockchain using block ranges (similar to cap table implementation)
- Use virtual paging: only query events for the current page's block range, not all events
- Cache recently loaded transactions to avoid redundant queries
- Implement efficient pagination that doesn't require loading all transactions into memory
- Process events in batches to avoid overwhelming the RPC provider

FR9: The system shall provide a CSV export function that:
- Exports only the currently filtered transactions (respects all active filters: address, transaction type, date range)
- Includes all transaction fields (hash, type, block, timestamp, from, to, amount, details)
- Formats timestamps in ISO 8601 format
- Formats addresses and amounts consistently
- Downloads file with descriptive filename (e.g., "chain-equity-transactions-YYYY-MM-DD.csv")

FR10: The system shall only display confirmed, successful on-chain transactions (transactions that have been mined and included in a block with successful status). Pending transactions and failed transactions shall not be displayed.

FR11: The system shall provide date range filtering that allows users to:
- Select a start date and end date to filter transactions within that time range
- Use date picker controls for selecting dates
- Convert start date and end date to block numbers BEFORE querying events (using binary search via `findBlockByTimestamp` utility)
- Query events only within the calculated block range (fromBlock to toBlock)
- Clear date range filter to show all transactions
- Combine date range filter with address and transaction type filters
- Show loading state during date-to-block conversion

FR12: The system shall provide transaction type filters allowing users to show/hide specific transaction types (e.g., show only Transfers, hide Splits).

FR13: The system shall display a transaction count indicator showing the total number of transactions matching the current filters (address, transaction type, date range).

FR14: The system shall provide clear visual feedback when:
- Loading transactions (loading spinner/skeleton)
- No transactions found (empty state message)
- Error occurred while fetching transactions (error message with retry option)

FR15: The system shall support deep linking: URLs with query parameters (e.g., `/transactions?address=0x...&startDate=2024-01-01&endDate=2024-12-31`) shall automatically load the transaction history with those filters applied.

### Non Functional

NFR1: The transaction history screen shall load initial page of transactions within 3 seconds on a standard connection.

NFR2: The system shall support querying transactions from the contract deployment block to the current block without performance degradation.

NFR3: The CSV export shall complete within 10 seconds for up to 10,000 transactions.

NFR4: The infinite scroll pagination shall load subsequent pages within 2 seconds.

NFR5: The system shall cache transaction data appropriately to minimize redundant blockchain queries while ensuring data freshness.

NFR6: The transaction history screen shall be responsive and usable on desktop, tablet, and mobile devices (following existing front-end specification).

NFR7: The transaction history screen shall comply with WCAG 2.1 AA accessibility standards (keyboard navigation, screen reader support, proper ARIA labels).

NFR8: The system shall handle network errors gracefully with user-friendly error messages and retry mechanisms.

NFR9: The system shall use the existing design system components and styling (dark theme, typography, spacing) as defined in the front-end specification.

NFR10: All blockchain queries shall use the existing RPC provider configuration and respect rate limits.

---

## User Interface Design Goals

### Overall UX Vision

The Transaction History Screen provides a comprehensive, transparent view of all on-chain activity for the Chain Equity token. The interface emphasizes clarity, efficiency, and navigation, allowing users to quickly understand transaction flows, filter by address or date range, and export data for analysis. The design follows the existing Chain Equity dark theme and minimal design principles, ensuring consistency with the rest of the application while handling large transaction volumes gracefully through infinite scroll and efficient pagination.

**Key UX Principles:**
- **Transparency First**: All transactions are visible and traceable, with clear visual linking between related transactions
- **Efficient Navigation**: Clickable addresses enable quick exploration of transaction history for any wallet
- **Scalable Design**: Interface handles tens of thousands of transactions without performance degradation
- **Progressive Disclosure**: Filters and advanced options are accessible but don't clutter the primary view
- **Immediate Feedback**: Loading states, empty states, and error messages provide clear user feedback

### Key Interaction Paradigms

**Infinite Scroll with Pagination:**
- Transactions load in pages (50 per page) as user scrolls
- Automatic loading when user approaches bottom of list
- Manual "Load More" button as alternative
- Loading indicator shows when fetching next page
- Smooth scroll behavior maintains user context

**Visual Transaction Linking:**
- Related send/receive transactions are visually connected using connecting lines
- Same transaction hash transactions grouped together
- Connecting lines visually link send and receive transactions that share the same transaction hash
- Paired transactions displayed in close proximity when possible
- Lines use subtle color (e.g., primary blue or gray) to indicate relationships without cluttering the interface

**Clickable Address Navigation:**
- All wallet addresses are clickable links
- Clicking an address navigates to transaction history with that address pre-filtered
- Visual indication that addresses are clickable (hover state, underline, or icon)
- Maintains current filter context when possible

**Multi-Filter System:**
- Address filter: Search/input field for wallet address
- Transaction type filter: Checkbox list or toggle buttons for each transaction type
- Date range filter: Date picker controls for start and end dates
- Filters work together (AND logic) - all active filters apply simultaneously
- Clear visual indication of active filters
- Easy filter clearing (individual or "Clear All" button)

**Export Functionality:**
- Prominent "Export CSV" button in filter area
- Export respects all active filters
- Loading state during export generation
- Success feedback when download initiates

### Core Screens and Views

**Transaction History Screen:**
- Primary screen displaying all transactions
- Filter section at top (collapsible on mobile, always visible on desktop):
  - Address input field
  - Transaction type checkboxes/toggle buttons
  - Date range pickers (start date, end date)
  - Export CSV button
  - Clear filters button
- Transaction count indicator showing total matching transactions
- Infinite scroll transaction list below filters
- Each transaction entry shows: type, timestamp, block number, from/to addresses, amount, transaction hash (clickable to open detail modal)
- Connecting lines visually link related send/receive transactions
- Empty state when no transactions match filters
- Loading state during initial load and pagination

**Transaction Detail Modal:**
- Separate modal dialog opened when clicking a transaction row
- Modal displays full transaction details:
  - Transaction type and status
  - Complete timestamp and block number
  - Full from/to addresses (with copy buttons)
  - Amount/value with full precision
  - All event-specific information (split multiplier, symbol change details, allowlist status, etc.)
  - Transaction hash with link to block explorer (if available)
  - Gas used and gas price (if available)
- Modal follows existing design system modal patterns (dark theme, centered overlay)
- Close button and click-outside-to-close functionality
- Keyboard accessible (ESC to close)

### Accessibility: WCAG AA

The Transaction History Screen shall comply with WCAG 2.1 Level AA standards:
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard (Tab, Enter, Space)
- **Screen Reader Support**: Semantic HTML, ARIA labels for transaction entries, descriptive labels for filters
- **Focus Indicators**: Clear focus rings on all clickable elements (addresses, buttons, inputs)
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Text Sizing**: Minimum 16px body text, support browser zoom up to 200%

### Branding

The Transaction History Screen follows the existing Chain Equity design system:
- **Dark Theme**: Uses existing dark theme color palette (Slate-900 background, Slate-800 surfaces)
- **Typography**: Inter or System UI for body text, monospace font for addresses and transaction hashes
- **Component Library**: Uses existing Button, Input, Table, and Card components from the design system
- **Icons**: Heroicons or Lucide Icons for consistency
- **Spacing**: Follows existing spacing scale (1rem base, 1.5rem for cards)
- **Color Usage**: Primary blue for links/actions, green for success, red for errors, consistent with existing UI

### Target Device and Platforms: Web Responsive

The Transaction History Screen is designed for web responsive deployment:
- **Desktop**: Full-width layout with horizontal filters, multi-column transaction display
- **Tablet**: Responsive layout with stacked filters, optimized column widths
- **Mobile**: Single column layout, collapsible filter section (expandable/collapsible with toggle button), touch-optimized interaction
- **Breakpoints**: Follows existing responsive strategy (Mobile: 0-640px, Tablet: 641-1024px, Desktop: 1025px+)
- **Touch Interactions**: Swipe gestures for mobile, larger touch targets
- **Progressive Enhancement**: Core functionality works on all devices, enhanced experience on larger screens

---

## Technical Assumptions

### Repository Structure: Monorepo

The Transaction History Screen feature will be implemented within the existing Chain Equity monorepo structure:
- **Frontend**: React components and hooks in `frontend/src/`
- **Backend**: Event querying service in `backend/src/` (if needed for server-side querying)
- **Contracts**: Existing ChainEquityToken contract in `contracts/src/`
- **Shared Types**: TypeScript types shared between frontend and backend

**Rationale**: The existing monorepo structure supports shared types and consistent development patterns. Transaction history can be implemented primarily in the frontend with direct blockchain queries, similar to the cap-table service pattern.

### Service Architecture

**Primary Implementation**: Frontend-based event querying using ethers.js (Following Cap Table Pattern)
- Transaction history queries will be performed directly from the frontend using ethers.js
- Use same pattern as cap table: `contract.queryFilter()` with block ranges (fromBlock, toBlock)
- Use `getContractDeploymentBlock()` utility to get deployment block (same as cap table)
- Queries will use the existing RPC provider configuration (Hardhat local network or Sepolia testnet)
- Event filtering will be done at query level when possible (address filter uses indexed parameters, transaction type filter queries only selected event types, date range filter converts to block range first)
- Virtual paging: Query events only for current page's block range, not all events
- Process events in batches (similar to cap table's batchSize = 10) to avoid overwhelming RPC provider

**Optional Backend Service**: If performance requires server-side querying
- Backend service in `backend/src/transaction-history.ts` (similar to cap-table service)
- Server-side event querying and filtering for large transaction volumes
- API endpoint for frontend to request paginated transaction data
- Caching layer for frequently accessed transaction data

**Rationale**: Frontend-based querying aligns with the existing cap-table pattern (direct blockchain queries). For large transaction volumes (tens of thousands), server-side querying with caching may be necessary for performance. Start with frontend implementation, add backend service if needed.

### Testing Requirements

**Testing Strategy**: Unit + Integration + Manual Testing
- **Unit Tests**: React components, hooks, and utility functions (Jest + React Testing Library)
- **Integration Tests**: Event querying logic, filtering, pagination (Jest)
- **Manual Testing**: End-to-end user flows, infinite scroll, filter combinations, CSV export
- **Performance Testing**: Large transaction volume testing (10,000+ transactions), pagination performance

**Rationale**: Transaction history is a critical user-facing feature requiring comprehensive testing. Unit tests for components and logic, integration tests for event querying, and manual testing for user experience validation. Performance testing ensures the system handles large transaction volumes efficiently.

### Additional Technical Assumptions and Requests

**Event Querying (Following Cap Table Pattern):**
- Use ethers.js `contract.queryFilter()` method (same as cap table implementation)
- Use `getContractDeploymentBlock()` utility from `frontend/src/lib/blockLookup.ts` to get deployment block
- Query events using block ranges (fromBlock, toBlock) - same pattern as cap table
- For date range filtering: Convert dates to block numbers FIRST using `findBlockByTimestamp()` utility, then query only that block range
- Filter events by contract address, event types (Transfer, SplitExecuted, SymbolChanged, AllowlistUpdated)
- Process events chronologically (by block number, then transaction index)
- Convert block numbers to timestamps using `provider.getBlock(blockNumber)` ONLY for display purposes (cache aggressively)
- Process events in batches (similar to cap table's batchSize = 10) to avoid overwhelming RPC provider

**Transaction Data Structure:**
- Transaction objects will include: hash, type, blockNumber, timestamp, from, to, amount, event-specific data
- Transaction types: Transfer, Mint, Burn, Split, SymbolChange, AllowlistUpdate
- Mint/Burn identified by Transfer events with zero address (from or to)
- Split identified by SplitExecuted event
- SymbolChange identified by SymbolChanged event
- AllowlistUpdate identified by AllowlistUpdated event

**Virtual Paging Strategy (Following Cap Table Pattern):**
- Use virtual paging: Calculate block range for current page based on estimated events per block
- Query events only for the current page's block range (fromBlock to toBlock)
- For reverse chronological order (newest first): Start from current block, work backwards
- Estimate block range: If ~50 events per page and ~10 events per block, query ~5 blocks per page
- Cache block ranges that have been queried to avoid redundant queries
- When user requests next page: Calculate next block range, query only that range
- Support infinite scroll with automatic loading when user approaches bottom
- Maintain separate pagination state per filter combination
- Clear pagination cache when filters change

**Filtering Implementation (Following Cap Table Pattern):**
- **Address filter**: Use indexed event parameters in `queryFilter()` - filter by `from` or `to` address at query level (e.g., `contract.filters.Transfer(address, null)` or `contract.filters.Transfer(null, address)`)
- **Transaction type filter**: Filter by event type at query level - query only the selected event types (Transfer, SplitExecuted, SymbolChanged, AllowlistUpdated)
- **Date range filter**: Convert dates to block numbers FIRST using `findBlockByTimestamp()` utility, then use those block numbers as fromBlock/toBlock in `queryFilter()` - NO client-side filtering needed
- Combine filters with AND logic (all active filters must match)
- Apply all filters at query level when possible (same pattern as cap table)
- Only apply complex filters client-side that cannot be done at query level

**Visual Linking:**
- Group transactions by transaction hash (same hash = related transactions)
- Use SVG or CSS to draw connecting lines between related transactions
- Lines should be subtle (gray or primary blue) to avoid cluttering interface
- Position lines dynamically based on transaction row positions

**CSV Export:**
- Generate CSV file client-side using JavaScript
- Include all transaction fields: hash, type, blockNumber, timestamp, from, to, amount, event-specific data
- Format timestamps in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Format addresses in lowercase with 0x prefix
- Format amounts with appropriate decimal precision
- Trigger download using browser download API

**Modal Implementation:**
- Use existing modal component from design system (if available)
- Or implement new modal component following design system patterns
- Modal should be accessible (keyboard navigation, screen reader support)
- Modal should handle long content (scrollable if needed)

**Performance Optimization:**
- Implement virtual scrolling or windowing for large transaction lists (if needed)
- Cache block timestamps to avoid redundant `getBlock()` calls
- Debounce filter inputs to avoid excessive queries
- Lazy load transaction details (only fetch full details when modal opens)
- Consider using Web Workers for heavy event processing (if needed)

**Dependencies:**
- **Frontend**: ethers.js v6 (existing), React 18.x (existing), TypeScript 5.x (existing)
- **Date Picker**: Use lightweight date picker library (e.g., react-datepicker) or HTML5 date inputs
- **CSV Export**: Use native JavaScript or lightweight CSV library (e.g., papaparse)
- **Modal**: Use existing modal component or implement custom modal following design system
- **Connecting Lines**: Use SVG or CSS for visual linking (no additional library needed)

---

## Epic List

### Epic 1: Transaction View
Implement a comprehensive transaction history screen that allows users to view all on-chain transactions, filter by address and date range, navigate between related transactions via clickable addresses, visualize transaction relationships with connecting lines, view detailed transaction information in a modal, and export transaction data to CSV. This epic delivers the complete transaction history feature with event querying, pagination, filtering, visual linking, transaction details, and export functionality.

---

## Epic 1: Transaction View

### Epic Goal

The Transaction View epic delivers a comprehensive transaction history screen that provides transparency and traceability for all on-chain Chain Equity token activity. Users can view transactions chronologically, filter by wallet address and date range, navigate between related transactions, visualize transaction relationships, view detailed transaction information, and export transaction data for analysis. The feature handles large transaction volumes efficiently through pagination and infinite scroll, ensuring a smooth user experience even with tens of thousands of transactions.

### Story 1.1: Event Querying Infrastructure

As a developer,
I want to implement event querying infrastructure that retrieves all blockchain events from the ChainEquityToken contract,
so that we can display transaction history to users.

#### Acceptance Criteria

1. Create a custom React hook `useTransactionHistory` that queries blockchain events using ethers.js (following same pattern as `useCapTable`)
2. Use `getContractDeploymentBlock()` utility from `frontend/src/lib/blockLookup.ts` to get deployment block (same as cap table)
3. Use `contract.queryFilter()` method with block ranges (fromBlock, toBlock) - same pattern as cap table
4. Query relevant events: Transfer, SplitExecuted, SymbolChanged, AllowlistUpdated using block ranges
5. For date range filters: Convert dates to block numbers FIRST using `findBlockByTimestamp()` utility, then use those blocks as query range
6. Process events chronologically (by block number, then transaction index)
7. Convert events to transaction objects with standardized structure: hash, type, blockNumber, timestamp, from, to, amount, event-specific data
8. Identify transaction types correctly:
   - Transfer: Standard Transfer events
   - Mint: Transfer events where from = zero address
   - Burn: Transfer events where to = zero address
   - Split: SplitExecuted events
   - SymbolChange: SymbolChanged events
   - AllowlistUpdate: AllowlistUpdated events
9. Convert block numbers to timestamps using provider.getBlock() ONLY for display (cache aggressively)
10. Handle errors gracefully with user-friendly error messages (same error handling pattern as cap table)
11. Implement loading states during event querying
12. Cache block timestamps to avoid redundant getBlock() calls
13. Support querying events in reverse chronological order (newest first) using virtual paging
14. Process events in batches (similar to cap table's batchSize = 10) to avoid overwhelming RPC provider

### Story 1.2: Basic Transaction List Display

As a user,
I want to view a list of all transactions in chronological order,
so that I can see the transaction history of the Chain Equity token.

#### Acceptance Criteria

1. Create TransactionHistory component that displays transactions in a list format
2. Display transactions in reverse chronological order (newest first) by default
3. Each transaction row displays: transaction type, timestamp, block number, from address (if applicable), to address (if applicable), amount (if applicable)
4. Format timestamps in human-readable format (e.g., "Dec 19, 2024 3:45 PM")
5. Format addresses with truncation (first 6 + last 4 characters) with option to show full address
6. Format amounts with appropriate decimal precision
7. Display transaction type with clear labels and icons
8. Show loading state while fetching transactions
9. Show empty state when no transactions are found
10. Follow existing design system (dark theme, typography, spacing)
11. Make transaction rows clickable (preparation for detail modal)

### Story 1.3: Infinite Scroll Pagination

As a user,
I want to scroll through transaction history with automatic loading of more transactions,
so that I can view large transaction volumes efficiently.

#### Acceptance Criteria

1. Implement virtual paging: Calculate block range for current page based on estimated events per block
2. Query events only for the current page's block range (fromBlock to toBlock) - do NOT query all events
3. Estimate block range: If ~50 events per page and ~10 events per block, query ~5 blocks per page
4. For reverse chronological order: Start from current block (or end block from date filter), work backwards
5. Implement infinite scroll that automatically loads next page when user approaches bottom (within 200px of bottom)
6. When loading next page: Calculate next block range backwards, query only that range
7. Display loading indicator when fetching next page
8. Provide "Load More" button as alternative to infinite scroll
9. Cache block ranges that have been queried to avoid redundant queries
10. Maintain separate pagination state per filter combination
11. Clear pagination cache when filters change
12. Maintain scroll position when loading new pages
13. Handle edge cases: no more transactions to load (reached deployment block or start date), network errors during pagination
14. Support efficient pagination for tens of thousands of transactions using virtual paging
15. Display transaction count indicator showing total matching transactions (may be approximate for large datasets)

### Story 1.4: Address Filtering

As a user,
I want to filter transactions by wallet address,
so that I can view all transactions involving a specific wallet.

#### Acceptance Criteria

1. Add address filter input field to filter section
2. Filter transactions where the address appears in from, to, or event-specific fields
3. Apply address filter in real-time as user types (with debouncing to avoid excessive queries)
4. Validate address format (Ethereum address format)
5. Show validation error for invalid addresses
6. Clear address filter functionality
7. Display active filter indicator when address filter is applied
8. Update transaction count to reflect filtered results
9. Support deep linking: URL parameter `?address=0x...` automatically applies address filter
10. Maintain filter state when navigating via clickable addresses

### Story 1.5: Transaction Type Filtering

As a user,
I want to filter transactions by transaction type,
so that I can view only specific types of transactions (e.g., only Transfers, hide Splits).

#### Acceptance Criteria

1. Add transaction type filter controls (checkboxes or toggle buttons) for each transaction type: Transfer, Mint, Burn, Split, SymbolChange, AllowlistUpdate
2. Allow users to select/deselect transaction types to show/hide
3. Apply transaction type filter in real-time
4. Display active filter indicators for selected transaction types
5. Provide "Select All" and "Deselect All" options
6. Clear transaction type filter functionality
7. Update transaction count to reflect filtered results
8. Combine transaction type filter with address filter (AND logic)
9. Maintain filter state during pagination
10. Support deep linking: URL parameter `?types=Transfer,Mint` applies transaction type filter

### Story 1.6: Date Range Filtering

As a user,
I want to filter transactions by date range,
so that I can view transactions within a specific time period.

#### Acceptance Criteria

1. Add date range filter with start date and end date pickers
2. Convert start date and end date to block numbers FIRST using `findBlockByTimestamp()` utility from `frontend/src/lib/blockLookup.ts`
3. Show loading state during date-to-block conversion (binary search can take a few seconds)
4. Use calculated block numbers as fromBlock/toBlock in event query (query only that block range)
5. Validate date range (start date must be before end date)
6. Validate that dates are not before contract deployment or in the future
7. Show validation error for invalid date ranges
8. Apply date range filter by recalculating block range and requerying events
9. Clear date range filter functionality (reset to deployment block to current block)
10. Display active filter indicator when date range filter is applied
11. Update transaction count to reflect filtered results
12. Combine date range filter with address and transaction type filters (AND logic) - all filters applied at query level
13. Support deep linking: URL parameters `?startDate=2024-01-01&endDate=2024-12-31` apply date range filter (convert to blocks on load)
14. Use lightweight date picker library (e.g., react-datepicker) or HTML5 date inputs
15. Cache date-to-block conversions to avoid redundant binary searches

### Story 1.7: Clickable Address Navigation

As a user,
I want to click on any wallet address in the transaction history,
so that I can navigate to view all transactions for that address.

#### Acceptance Criteria

1. Make all wallet addresses in transaction history clickable
2. Visual indication that addresses are clickable (hover state, underline, or icon)
3. Clicking an address navigates to transaction history with that address pre-filtered
4. Maintain current filter context when possible (e.g., keep date range filter active)
5. Update URL with address parameter for deep linking support
6. Support clicking addresses in from, to, and event-specific fields
7. Provide clear visual feedback on address hover/click
8. Ensure addresses are accessible via keyboard navigation
9. Support opening address filter in new tab/window (right-click, Ctrl+Click)
10. Display loading state when applying address filter via click

### Story 1.8: Visual Transaction Linking

As a user,
I want to see visual connections between related send and receive transactions,
so that I can understand transaction relationships and flows.

#### Acceptance Criteria

1. Group transactions by transaction hash (same hash = related transactions)
2. Identify related send/receive transactions that share the same transaction hash
3. Draw connecting lines between related transactions using SVG or CSS
4. Position connecting lines dynamically based on transaction row positions
5. Use subtle color (gray or primary blue) for connecting lines to avoid cluttering interface
6. Ensure connecting lines are visible and don't overlap with transaction content
7. Handle edge cases: transactions spanning multiple pages, single transactions without pairs
8. Make connecting lines responsive (adjust on window resize)
9. Ensure connecting lines don't interfere with clickable addresses or transaction rows
10. Optimize line rendering performance for large transaction lists

### Story 1.9: Transaction Detail Modal

As a user,
I want to view detailed information about a specific transaction,
so that I can see all transaction details including event-specific data.

#### Acceptance Criteria

1. Create TransactionDetailModal component following design system modal patterns
2. Open modal when user clicks on a transaction row
3. Display full transaction details:
   - Transaction type and status
   - Complete timestamp and block number
   - Full from/to addresses (with copy buttons)
   - Amount/value with full precision
   - All event-specific information (split multiplier, symbol change details, allowlist status, etc.)
   - Transaction hash with link to block explorer (if available)
   - Gas used and gas price (if available)
4. Modal follows existing design system (dark theme, centered overlay)
5. Close button and click-outside-to-close functionality
6. Keyboard accessible (ESC to close, Tab navigation)
7. Screen reader support with proper ARIA labels
8. Handle long content (scrollable if needed)
9. Display loading state if fetching additional transaction details
10. Support opening modal via keyboard navigation

### Story 1.10: CSV Export Functionality

As a user,
I want to export filtered transaction history to CSV,
so that I can analyze transaction data in external tools.

#### Acceptance Criteria

1. Add "Export CSV" button to filter section
2. Export only currently filtered transactions (respects all active filters: address, transaction type, date range)
3. Generate CSV file client-side using JavaScript
4. Include all transaction fields: hash, type, blockNumber, timestamp, from, to, amount, event-specific data
5. Format timestamps in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
6. Format addresses in lowercase with 0x prefix
7. Format amounts with appropriate decimal precision
8. Trigger download using browser download API
9. Use descriptive filename (e.g., "chain-equity-transactions-YYYY-MM-DD.csv")
10. Display loading state during CSV generation
11. Show success feedback when download initiates
12. Handle errors gracefully (e.g., too many transactions, browser download restrictions)
13. Support exporting up to 10,000 transactions within 10 seconds

### Story 1.11: Responsive Design & Mobile Optimization

As a user,
I want to use the transaction history screen on mobile devices,
so that I can view transaction history on any device.

#### Acceptance Criteria

1. Implement responsive layout for mobile, tablet, and desktop breakpoints
2. Filter section collapsible on mobile (expandable/collapsible with toggle button)
3. Single column layout on mobile, multi-column on desktop
4. Touch-optimized interactions (larger touch targets, swipe gestures)
5. Optimize transaction list display for mobile screens
6. Ensure connecting lines work on mobile (adjust positioning for smaller screens)
7. Modal displays properly on mobile (full screen or appropriately sized)
8. Date pickers work on mobile (native date inputs or mobile-optimized picker)
9. CSV export works on mobile devices
10. Test on various screen sizes (Mobile: 0-640px, Tablet: 641-1024px, Desktop: 1025px+)

### Story 1.12: Performance Optimization & Polish

As a user,
I want the transaction history screen to perform well with large transaction volumes,
so that I can efficiently view and interact with tens of thousands of transactions.

#### Acceptance Criteria

1. Optimize event querying for large transaction volumes (efficient batch queries)
2. Implement virtual scrolling or windowing if needed for very large lists
3. Debounce filter inputs to avoid excessive queries
4. Cache block timestamps to avoid redundant getBlock() calls
5. Lazy load transaction details (only fetch full details when modal opens)
6. Optimize connecting line rendering for performance
7. Ensure initial page load completes within 3 seconds
8. Ensure subsequent page loads complete within 2 seconds
9. Test with 10,000+ transactions to verify performance
10. Optimize CSV export for large transaction volumes
11. Finalize UI/UX polish: spacing, colors, typography, animations
12. Ensure all accessibility requirements are met (WCAG 2.1 AA)
13. Test keyboard navigation and screen reader support
14. Verify all error states and edge cases are handled gracefully

---

## Checklist Results Report

_To be completed after running the PM checklist. This section will contain the results of the checklist validation._

---

## Architectural Review & Issues

### Critical Issues

**1. Functional Requirement Numbering Inconsistency** ✅ FIXED
- **Issue**: FR15 appeared before FR11 in the document, breaking sequential numbering
- **Impact**: Confusion during development and testing
- **Status**: Fixed - FR15 renumbered to FR11, subsequent requirements renumbered accordingly

**2. Performance: Block Timestamp Conversion Bottleneck** ✅ ADDRESSED
- **Issue**: Converting block numbers to timestamps using `provider.getBlock(blockNumber)` for every transaction will be extremely slow for large datasets
- **Impact**: Initial load could take minutes for 10,000+ transactions, violating NFR1 (3 second load time)
- **Status**: Addressed - PRD now specifies:
  - Date-to-block conversion happens BEFORE querying (using `findBlockByTimestamp()`)
  - Events queried only within calculated block range (virtual paging)
  - Block timestamps converted ONLY for display purposes (cached aggressively)
  - Virtual paging ensures only current page's events are queried, not all events

**3. Client-Side Filtering Inefficiency** ✅ ADDRESSED
- **Issue**: PRD suggested querying all events then filtering client-side, which is inefficient for large datasets
- **Impact**: Unnecessary data transfer and processing, poor performance
- **Status**: Addressed - PRD now specifies:
  - All filters applied at query level when possible (following cap table pattern)
  - Address filter uses indexed event parameters in `queryFilter()`
  - Transaction type filter queries only selected event types
  - Date range filter converts to block range FIRST, then queries only that range
  - Virtual paging queries only current page's block range

**4. Transaction Count Calculation Challenge**
- **Issue**: FR12 requires showing total count of matching transactions, but with client-side filtering and pagination, getting accurate count efficiently is difficult
- **Impact**: Either requires querying all events (slow) or maintaining separate count queries (complex)
- **Recommendation**:
  - For filtered queries, perform count query separately using same filters
  - Cache count results and update only when filters change
  - Consider approximate counts for very large datasets with note "~X transactions"
  - If using backend service, count can be calculated server-side efficiently

**5. CSV Export Memory Constraints**
- **Issue**: Exporting 10,000 transactions client-side could cause browser memory issues, especially with large transaction objects
- **Impact**: Browser crashes or freezing during export
- **Recommendation**:
  - Stream CSV generation for large datasets (generate in chunks)
  - Consider backend export service for datasets > 5,000 transactions
  - Show memory warning for large exports
  - Implement progress indicator for long-running exports

### Important Issues

**6. Missing Contract Deployment Block Strategy**
- **Issue**: PRD mentions querying from "contract deployment block" but doesn't specify how to obtain it
- **Impact**: Implementation uncertainty
- **Recommendation**: 
  - Use existing `getContractDeploymentBlock()` utility from `frontend/src/lib/blockLookup.ts`
  - Cache deployment block in component state or localStorage
  - Handle case where deployment block cannot be determined (fallback to block 0 or user-specified block)

**7. RPC Rate Limiting & Error Handling**
- **Issue**: NFR10 mentions respecting rate limits but doesn't specify error handling strategy
- **Impact**: Poor user experience when rate limited
- **Recommendation**:
  - Implement exponential backoff for rate limit errors
  - Show user-friendly error message with retry option
  - Consider request queuing/throttling to prevent rate limits
  - Monitor request frequency and warn users approaching limits

**8. Date Range Filtering Performance** ✅ ADDRESSED
- **Issue**: Date range filtering requires converting dates to block ranges, which requires binary search (as seen in `blockLookup.ts`)
- **Impact**: Slow filter application, especially for old dates
- **Status**: Addressed - PRD now specifies:
  - Date-to-block conversion happens BEFORE querying (using `findBlockByTimestamp()` utility)
  - Show loading state during date-to-block conversion
  - Cache date-to-block conversions to avoid redundant binary searches
  - Use calculated block numbers as fromBlock/toBlock in query (query only that range)
  - This ensures query performance is reasonable even with date filters

**9. Connecting Lines Performance for Large Lists**
- **Issue**: Drawing SVG connecting lines for 10,000+ transactions could cause rendering performance issues
- **Impact**: UI lag, especially during scroll
- **Recommendation**:
  - Only render connecting lines for visible transactions (viewport culling)
  - Use Canvas instead of SVG for better performance with many lines
  - Debounce line position calculations on scroll
  - Consider disabling connecting lines for very large lists (>1000 visible transactions)

**10. Deep Linking Security & Validation**
- **Issue**: Deep linking with URL parameters doesn't specify validation strategy
- **Impact**: Potential XSS or injection issues, invalid filter states
- **Recommendation**:
  - Validate all URL parameters (address format, date format, transaction types)
  - Sanitize inputs before applying filters
  - Handle invalid parameters gracefully (show error, use defaults)
  - Use URL encoding properly for special characters

**11. Pagination Strategy with Filters** ✅ ADDRESSED
- **Issue**: Pagination strategy didn't account for how filters affect pagination (filtered results may have gaps)
- **Impact**: Confusing pagination behavior, incorrect "has more" calculations
- **Status**: Addressed - PRD now specifies:
  - Virtual paging: Query events only for current page's block range
  - Maintain separate pagination state per filter combination
  - Clear pagination cache when filters change
  - Recalculate block range when filters change
  - All filters applied at query level, so pagination works correctly with filters

**12. Transaction Hash Grouping Edge Cases**
- **Issue**: FR5 groups transactions by hash, but doesn't address cases where multiple events share same hash (e.g., Transfer + AllowlistUpdate in same transaction)
- **Impact**: Visual linking may show incorrect relationships
- **Recommendation**:
  - Group by transaction hash AND event type for Transfer events specifically
  - Only link Transfer events (send/receive pairs)
  - Other event types (Split, SymbolChange) don't need linking
  - Handle transactions with multiple Transfer events (batch transfers)

### Minor Issues

**13. Missing Error Recovery Strategy**
- **Issue**: Error handling mentioned but no recovery/retry strategy specified
- **Recommendation**: Implement automatic retry with exponential backoff for transient errors

**14. Modal Data Fetching Unclear**
- **Issue**: Story 1.9 mentions "fetching additional transaction details" but doesn't specify what additional data is needed
- **Recommendation**: Clarify if modal needs additional blockchain queries or if all data is already in transaction object

**15. Block Explorer Link Availability**
- **Issue**: Transaction hash links to block explorer "if available" - need to specify when it's available
- **Recommendation**: 
  - Hardhat local network: No block explorer
  - Sepolia testnet: Etherscan
  - Mainnet: Etherscan
  - Make block explorer URL configurable via environment variable

### Recommendations Summary

1. ✅ **Fix FR numbering** (FR15 → FR11) - COMPLETED
2. ✅ **Implement aggressive block timestamp caching** (critical for performance) - SPECIFIED IN PRD
3. ✅ **Filter at query level** when possible, not client-side - SPECIFIED IN PRD (following cap table pattern)
4. ✅ **Use existing utilities** from `blockLookup.ts` for deployment block and date-to-block conversion - SPECIFIED IN PRD
5. ✅ **Virtual paging strategy** - SPECIFIED IN PRD (query only current page's block range)
6. ✅ **Date-to-block conversion before querying** - SPECIFIED IN PRD (ensures reasonable load times)
7. **Implement request throttling** to prevent RPC rate limits - STILL RECOMMENDED
8. **Add viewport culling** for connecting lines - STILL RECOMMENDED
9. **Validate and sanitize** all URL parameters for deep linking - STILL RECOMMENDED
10. **Specify block explorer** configuration strategy - STILL RECOMMENDED
11. **Add error recovery** mechanisms with retry logic - STILL RECOMMENDED

---

## Implementation Guidance

### Component Structure

**Recommended Component Hierarchy:**
```
TransactionHistoryPage/
├── TransactionFilters/
│   ├── AddressFilter (input with validation)
│   ├── TransactionTypeFilter (checkbox group)
│   ├── DateRangeFilter (date picker pair)
│   ├── ExportButton
│   └── ClearFiltersButton
├── TransactionCount (indicator)
├── TransactionList/
│   ├── TransactionRow[] (with connecting lines)
│   ├── LoadingIndicator
│   ├── EmptyState
│   └── ErrorState
└── TransactionDetailModal/
    ├── TransactionHeader
    ├── TransactionDetails
    └── TransactionActions (copy buttons, explorer link)
```

**File Organization:**
- `frontend/src/pages/TransactionHistory.tsx` - Main page component
- `frontend/src/components/TransactionHistory/` - Feature-specific components
  - `TransactionFilters.tsx` - Filter section component
  - `TransactionList.tsx` - List container with infinite scroll
  - `TransactionRow.tsx` - Individual transaction row
  - `TransactionDetailModal.tsx` - Detail modal component
  - `ConnectingLines.tsx` - SVG overlay for visual linking
- `frontend/src/hooks/useTransactionHistory.ts` - Event querying hook
- `frontend/src/utils/transactionUtils.ts` - Transaction formatting utilities

### Visual Design Specifications

**Filter Section Layout:**
- **Desktop**: Horizontal layout with filters side-by-side
  - Address input: 320px width
  - Transaction type checkboxes: Flexible width, wrap to multiple rows if needed
  - Date range: Two date inputs side-by-side (150px each)
  - Export button: Right-aligned, 120px width
  - Clear filters button: Right-aligned, 100px width
- **Mobile**: Collapsible section with toggle button
  - Collapsed: Shows filter count badge and "Filters" button
  - Expanded: Vertical stack of all filters
  - Toggle button: Full width, 44px height (touch target)
- **Spacing**: 1rem (16px) between filter groups, 0.5rem (8px) between related controls
- **Background**: Slate-800 surface color with 1px Slate-700 border
- **Padding**: 1.5rem (24px) internal padding

**Transaction List Design:**
- **Row Height**: Minimum 64px per transaction row
- **Row Spacing**: 0.5rem (8px) gap between rows
- **Row Background**: Slate-800 with hover state (Slate-750 on hover)
- **Row Border**: 1px Slate-700 border-bottom
- **Column Layout** (Desktop):
  - Type icon + label: 120px
  - Timestamp: 180px
  - Block number: 100px
  - From address: 200px (truncated)
  - To address: 200px (truncated)
  - Amount: 150px (right-aligned)
  - Transaction hash: 120px (truncated)
- **Mobile Layout**: Single column, stacked information
  - Type + Timestamp on first line
  - From/To addresses on second line (with arrow icon)
  - Amount + Block on third line
  - Transaction hash on fourth line (smaller text)

**Transaction Type Icons & Colors:**
- **Transfer**: Arrow-right icon, Blue-500 (#3B82F6)
- **Mint**: Plus icon, Green-500 (#10B981)
- **Burn**: Minus icon, Red-500 (#EF4444)
- **Split**: Split icon, Amber-500 (#F59E0B)
- **SymbolChange**: Edit icon, Purple-500 (#A855F7)
- **AllowlistUpdate**: Check-circle icon, Gray-500 (#6B7280)

**Connecting Lines:**
- **Color**: Blue-400 (#60A5FA) with 50% opacity
- **Stroke Width**: 2px
- **Style**: Curved bezier path (smooth curve between transactions)
- **Z-Index**: Behind transaction rows but above background
- **Animation**: Subtle fade-in (200ms) when transactions load
- **Responsive**: Adjust curve radius on smaller screens

**Transaction Detail Modal:**
- **Width**: 600px (desktop), 90vw (mobile)
- **Max Height**: 80vh with internal scrolling
- **Background**: Slate-800 with Slate-900 overlay (80% opacity)
- **Padding**: 2rem (32px) internal padding
- **Border Radius**: 0.5rem (8px)
- **Shadow**: Large shadow for depth
- **Close Button**: Top-right corner, 32x32px, X icon

### Interaction Patterns

**Filter Interactions:**
- **Address Input**: 
  - Debounce: 500ms delay before applying filter
  - Validation: Real-time format checking (Ethereum address regex)
  - Error state: Red border + error message below input
  - Success state: Green checkmark icon when valid
- **Transaction Type Checkboxes**:
  - Toggle on click
  - Visual feedback: Checkmark animation (200ms)
  - "Select All" / "Deselect All" buttons above checkbox group
- **Date Range Pickers**:
  - Native date inputs or react-datepicker library
  - Validation: Start date must be before end date
  - Clear button (X icon) in each input when date selected
- **Export Button**:
  - Loading state: Spinner replaces button text during export
  - Success feedback: Toast notification (5 second auto-dismiss)
  - Disabled state: When no transactions to export

**Transaction Row Interactions:**
- **Hover State**: 
  - Background: Slate-750
  - Cursor: Pointer
  - Subtle scale: 1.01 (200ms transition)
- **Click**: Opens transaction detail modal
- **Address Click**: 
  - Prevents row click (event.stopPropagation)
  - Navigates with address filter applied
  - Visual feedback: Underline animation (200ms)
- **Keyboard Navigation**:
  - Tab: Navigate between rows
  - Enter/Space: Open detail modal
  - Arrow keys: Navigate between transactions (optional enhancement)

**Infinite Scroll:**
- **Trigger Distance**: 200px from bottom of list
- **Loading Indicator**: Skeleton rows or spinner at bottom
- **Load More Button**: 
  - Appears as alternative to infinite scroll
  - Positioned at bottom of list
  - Full width, 44px height
  - Shows "Load More (X remaining)" when applicable

**Modal Interactions:**
- **Open Animation**: Fade + scale (250ms)
  - Opacity: 0 → 1
  - Scale: 0.95 → 1
- **Close Animation**: Fade + scale (200ms, reverse)
- **Click Outside**: Closes modal (with confirmation if unsaved changes)
- **ESC Key**: Closes modal
- **Tab Navigation**: Traps focus within modal
- **Scroll**: Internal scrollbar when content exceeds max height

### State Management

**Recommended State Structure:**
```typescript
interface TransactionHistoryState {
  // Filter state
  addressFilter: string | null;
  transactionTypeFilter: TransactionType[];
  dateRangeFilter: { start: Date | null; end: Date | null };
  
  // Transaction data
  transactions: Transaction[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  
  // UI state
  selectedTransaction: Transaction | null;
  isModalOpen: boolean;
  isFiltersExpanded: boolean; // Mobile only
}
```

**State Updates:**
- Use React hooks (useState, useReducer) for local component state
- Consider Context API for shared filter state if needed across components
- URL query parameters should sync with filter state for deep linking
- Debounce filter inputs to avoid excessive state updates

### Accessibility Implementation

**ARIA Labels:**
```tsx
// Transaction row
<article 
  role="button"
  aria-label={`Transaction ${transaction.type} at ${transaction.timestamp}`}
  tabIndex={0}
  aria-describedby={`transaction-${transaction.hash}`}
>
  {/* Transaction content */}
</article>

// Filter section
<section aria-label="Transaction filters">
  <label htmlFor="address-filter">Filter by wallet address</label>
  <input 
    id="address-filter"
    aria-describedby="address-filter-error"
    aria-invalid={hasError}
  />
  {hasError && (
    <div id="address-filter-error" role="alert">
      Invalid address format
    </div>
  )}
</section>

// Modal
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="transaction-detail-title"
  aria-describedby="transaction-detail-content"
>
```

**Keyboard Navigation:**
- All interactive elements must be focusable via Tab
- Focus order: Filters → Transaction list → Modal (when open)
- Skip links for main content (optional but recommended)
- Focus trap in modal (prevent tabbing outside)

**Screen Reader Support:**
- Semantic HTML (article, section, nav, button)
- Descriptive labels for all inputs and buttons
- Live regions for dynamic content (transaction count, loading states)
- Status announcements for filter changes

### Responsive Design Breakpoints

**Mobile (0-640px):**
- Filter section: Collapsible, full width
- Transaction list: Single column, stacked layout
- Transaction row: Minimum 80px height (larger touch targets)
- Modal: Full screen (90vw width, 90vh height)
- Connecting lines: Simplified (straight lines, no curves)
- Date pickers: Native mobile date inputs

**Tablet (641-1024px):**
- Filter section: Always visible, 2-column layout
- Transaction list: 2-column layout for transaction info
- Transaction row: 64px height
- Modal: 70vw width, centered
- Connecting lines: Curved bezier paths

**Desktop (1025px+):**
- Filter section: Horizontal layout, all filters visible
- Transaction list: Full multi-column layout
- Transaction row: 64px height
- Modal: 600px width, centered
- Connecting lines: Full curved bezier paths with smooth animations

### Animation & Micro-interactions

**Loading States:**
- **Skeleton Loaders**: Pulse animation (2s duration, infinite)
- **Spinner**: Rotate animation (1s duration, infinite, linear)
- **Progress Indicator**: For CSV export (linear progress bar)

**Transitions:**
- **Filter Changes**: Fade out old results (150ms) → Fade in new results (200ms)
- **Modal Open/Close**: Fade + scale (250ms ease-out)
- **Row Hover**: Background color transition (150ms ease-in-out)
- **Address Click**: Underline animation (200ms ease-out)
- **Checkbox Toggle**: Scale animation (150ms ease-out)

**Performance Considerations:**
- Use CSS transforms for animations (GPU-accelerated)
- Reduce motion for users with `prefers-reduced-motion`
- Lazy load animations (only animate visible elements)
- Debounce scroll events for infinite scroll trigger

### Component Library Usage

**Existing Components to Reuse:**
- **Button**: Primary, Secondary, Destructive variants
- **Input**: Text input with validation states
- **Modal**: Base modal component (if available)
- **Card**: Container component for filter section
- **Icon**: Heroicons or Lucide Icons

**New Components to Create:**
- **TransactionRow**: Custom component with connecting line integration
- **ConnectingLines**: SVG overlay component
- **TransactionTypeBadge**: Badge component with icon and color
- **DateRangePicker**: Date range input component
- **TransactionDetailModal**: Specialized modal for transaction details

**Styling Approach:**
- Use Tailwind CSS utility classes
- Follow existing design system spacing scale
- Use CSS variables for colors (if design system supports)
- Create component-specific styles only when necessary

### Error States & Edge Cases

**Error State Design:**
- **Network Error**: 
  - Icon: Alert-circle (Red-500)
  - Message: "Unable to load transactions. Please check your connection."
  - Action: "Retry" button
  - Layout: Centered, 400px width card
- **No Transactions Found**:
  - Icon: Inbox (Gray-400)
  - Message: "No transactions match your filters."
  - Action: "Clear Filters" button
- **Invalid Address**:
  - Inline error below input
  - Red border on input
  - Error message: "Please enter a valid Ethereum address (0x...)"
- **Date Range Error**:
  - Inline error below date inputs
  - Error message: "Start date must be before end date"

**Loading States:**
- **Initial Load**: Full-page skeleton or spinner
- **Pagination Load**: Bottom-of-list spinner or skeleton rows
- **Filter Load**: Fade transition with loading overlay
- **Export Load**: Button shows spinner, disabled state

### Testing Considerations

**Visual Testing:**
- Test with various transaction volumes (0, 10, 100, 1000, 10000+)
- Test filter combinations (all filters, single filter, no filters)
- Test responsive layouts at all breakpoints
- Test connecting lines with various transaction positions
- Test modal with long content (scrollable)

**Interaction Testing:**
- Test keyboard navigation (Tab, Enter, Space, ESC)
- Test screen reader compatibility (NVDA, JAWS, VoiceOver)
- Test touch interactions on mobile devices
- Test infinite scroll trigger at various scroll positions
- Test filter debouncing and validation

**Performance Testing:**
- Measure initial load time (target: <3 seconds)
- Measure pagination load time (target: <2 seconds)
- Test with 10,000+ transactions
- Monitor memory usage during infinite scroll
- Test CSV export with large datasets (10,000 transactions)

---

## Next Steps

### UX Expert Prompt

Create detailed UI/UX specifications and wireframes for the Transaction History Screen feature based on this PRD. Focus on:
- Visual design for transaction list with connecting lines
- Filter section layout and interaction patterns
- Transaction detail modal design
- Responsive design for mobile, tablet, and desktop
- Accessibility considerations (WCAG 2.1 AA)
- Integration with existing Chain Equity design system

Reference the existing [Front-End Specification](../front-end-spec.md) for design system patterns and ensure consistency.

### Architect Prompt

Create technical architecture and implementation plan for the Transaction History Screen feature based on this PRD. Focus on:
- Event querying architecture using ethers.js
- Pagination and infinite scroll implementation strategy
- Filtering logic and performance optimization
- Visual linking implementation (SVG/CSS connecting lines)
- Modal component architecture
- CSV export implementation
- Performance optimization for large transaction volumes (10,000+ transactions)
- Integration with existing Chain Equity frontend architecture

Reference the existing [Architecture Documentation](../architecture/) for system patterns and ensure consistency with the monorepo structure.

