# Block Number Lookup by Date/Time - Product Requirements Document

## Goals and Background Context

### Goals

- Enable users to query cap-table data at a specific historical date/time
- Convert user-provided date/time (browser timezone) to the corresponding blockchain block number
- Improve user experience for historical cap-table analysis by allowing date-based queries instead of requiring block numbers
- Support timezone-aware date/time input using the user's browser timezone

### Background Context

The ChainEquity application currently supports querying cap-table data at specific block numbers, which requires users to know the exact block number. This is not user-friendly for historical analysis, as users typically think in terms of dates and times rather than block numbers. Adding date/time-to-block-number lookup will make the cap-table feature more accessible and intuitive, allowing users to query historical equity data by selecting a date and time that's meaningful to them (e.g., "as of December 31, 2023 at 5:00 PM").

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-12-XX | 1.0 | Initial PRD for block number lookup by date/time | PM |

---

## Requirements

### Functional Requirements

**FR1:** The system must accept date and time input from users in their browser's local timezone.

**FR2:** The system must convert the user-provided date/time to a Unix timestamp (UTC) for blockchain queries.

**FR3:** The system must find the exact block number that was mined at or before the specified timestamp (the latest block with timestamp ≤ user's timestamp).

**FR4:** The system must display the found block number to the user after lookup.

**FR5:** The system must allow users to use the found block number to query cap-table data at that historical point.

**FR6:** The system must handle cases where the requested date/time is in the future (show appropriate error message).

**FR7:** The system must handle cases where the requested date/time is before the contract deployment block (show appropriate error message).

**FR8:** The system must provide visual feedback during the block lookup process (loading state with progress indicator).

**FR9:** The system must display the block timestamp (converted back to user's timezone) for the found block to confirm accuracy.

**FR10:** The system must support both manual date/time input and date/time picker UI components.

**FR11:** The system must display the user's timezone (browser timezone) clearly in the UI (e.g., "Your timezone: EST" or "Timezone: America/New_York").

### Non-Functional Requirements

**NFR1:** Block lookup must complete within 10 seconds for typical queries (may require binary search algorithm for efficiency).

**NFR2:** The lookup algorithm must minimize RPC calls to avoid rate limiting (use efficient binary search strategy).

**NFR3:** The feature must work with both Hardhat local network and Sepolia testnet (handle different block times).

**NFR4:** Error messages must be user-friendly and explain why lookup failed (future date, before contract deployment, network error).

**NFR5:** The date/time input must validate format and prevent invalid dates (e.g., February 30th).

**NFR6:** The UI must clearly display the user's browser timezone (no timezone selection needed).

**NFR7:** The feature must gracefully handle network errors during RPC queries (retry logic or clear error messaging).

---

## User Interface Design Goals

### Overall UX Vision

The block number lookup feature should integrate seamlessly with the existing Cap Table page, allowing users to find a block number by date/time and use it to query historical cap-table data. The experience should be simple: users enter a date/time using a datetime-local input, the system automatically finds the block number, and users click "Refresh" to update the cap table. The UI should clearly show the user's timezone inline with the date input.

### Key Interaction Paradigms

- **Date/Time Input:** Users enter date and time using a `datetime-local` input button next to the existing block number input field, with timezone displayed inline.
- **Automatic Lookup:** When a date/time is selected, the system automatically finds the corresponding block number.
- **Refresh Action:** Users click the existing "Refresh" button to update the cap table with the found block number.
- **Result Display:** Display the found block number and its timestamp (in user's timezone) for verification.
- **Error Handling:** Clear error messages for edge cases (future dates, before contract deployment, network errors).

### Core Screens and Views

**Cap Table Page Enhancement:**
- Add a `datetime-local` input next to the existing block number input field
- Display user's timezone inline with the date input (e.g., "Your timezone: EST" or "Timezone: America/New_York")
- Show lookup results (block number and timestamp) after successful lookup
- The found block number automatically populates the block number input field
- Users click the existing "Refresh" button to query cap-table data with the found block
- Maintain existing block number input for users who prefer direct entry

**Key UI Elements:**
- `datetime-local` input positioned next to block number input
- Timezone display inline with the date input (read-only, browser-detected)
- Automatic block lookup when date/time is selected
- Result display showing:
  - Found block number (populated in block number input)
  - Block timestamp (converted to user's timezone)
- Loading state with progress indicator during lookup
- Error messages for invalid inputs or lookup failures
- Existing "Refresh" button triggers cap-table query with found block

### Accessibility: WCAG AA

- All inputs must be keyboard accessible
- Form labels must be properly associated with inputs
- Error messages must be announced to screen readers
- Loading states must be communicated to assistive technologies
- Color contrast must meet WCAG AA standards (already established in existing dark theme)

### Branding

- Maintain existing dark theme styling (Tailwind CSS v4)
- Use existing component library (Card, Input, Button, StatusIndicator)
- Follow existing color palette and typography
- Match existing spacing and layout patterns

### Target Device and Platforms: Web Responsive

- Primary: Desktop web browsers
- Responsive design for tablet and mobile devices
- Browser timezone detection using JavaScript Intl API
- `datetime-local` input should work across modern browsers

---

## Technical Assumptions

### Repository Structure: Monorepo

The feature will be implemented within the existing monorepo structure, specifically in the `frontend/` workspace. No changes to repository structure are needed.

### Service Architecture

The block lookup feature will be implemented as a frontend-only feature using React hooks pattern, consistent with existing hooks like `useCapTable` and `useExecuteSplit`. The lookup logic will use ethers.js v6 to query the blockchain RPC directly, similar to how cap-table queries work.

**Implementation Approach:**
- Create a new React hook `useBlockLookup` for block lookup functionality
- Use `ethers.BrowserProvider` (existing pattern) to query blockchain
- Implement binary search algorithm to find block by timestamp efficiently
- Integrate with existing `CapTable` page component
- Find contract deployment block to use as minimum search range (not genesis block 0)

### Testing Requirements

**Unit Testing:**
- Test binary search algorithm with mock block data
- Test timezone conversion logic
- Test edge cases (future dates, before contract deployment)

**Integration Testing:**
- Test block lookup with actual RPC calls (local Hardhat network)
- Test contract deployment block detection
- Test integration with Cap Table page
- Test error handling for network failures

**Manual Testing:**
- Test with different timezones
- Test with Hardhat local network and Sepolia testnet
- Verify UI/UX flow end-to-end
- Verify progress indicator during binary search

### Additional Technical Assumptions and Requests

**Blockchain RPC Methods:**
- Use `provider.getBlockNumber()` to get current block number
- Use `provider.getBlock(blockNumber)` to get block information including timestamp
- Use binary search algorithm to efficiently find block by timestamp
- Find contract deployment block by querying contract's creation transaction
- Algorithm: Start with current block, use binary search between contract deployment block and current block to find latest block with timestamp ≤ target timestamp

**Contract Deployment Block Detection:**
- Get contract address from environment variable (`VITE_CONTRACT_ADDRESS`)
- Query contract's creation transaction using `provider.getTransactionReceipt(deploymentTxHash)` or by finding the first transaction to the contract address
- Extract block number from deployment transaction
- Use this as the minimum search range (instead of genesis block 0)
- Cache deployment block number for the session to avoid repeated queries

**Timezone Handling:**
- Use `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect browser timezone
- Convert user's date/time input (local timezone) to Unix timestamp (UTC) for blockchain queries
- Convert block timestamp (Unix timestamp) back to user's timezone for display

**Date/Time Input:**
- Use HTML5 `datetime-local` input type
- Browser will handle date/time picker UI
- Input value will be in local timezone format (YYYY-MM-DDTHH:mm)

**Binary Search Algorithm:**
- Start with current block number
- Get contract deployment block number (minimum search range)
- Get block timestamp at current block
- If target timestamp > current block timestamp → error (future date)
- If target timestamp < contract deployment block timestamp → error (before contract deployment)
- Binary search between contract deployment block and current block to find latest block with timestamp ≤ target
- Algorithm complexity: O(log n) where n is number of blocks between deployment and current, minimizing RPC calls
- Show progress indicator during binary search (e.g., "Searching blocks...", show current search range)

**Progress Indicator:**
- Display loading state with progress feedback during binary search
- Show current search range (e.g., "Searching blocks 1000-5000...")
- Update progress as binary search narrows the range
- Use existing `StatusIndicator` component with pending variant

**Error Handling:**
- Network errors: Display user-friendly error message, allow retry
- Future dates: "The selected date/time is in the future. Please select a past date."
- Before contract deployment: "The selected date/time is before the contract was deployed. Please select a later date."
- RPC rate limiting: Implement retry logic with exponential backoff if needed

**Performance Considerations:**
- Binary search should complete in <10 seconds for typical queries
- Progress indicator provides feedback during potentially slow queries
- Limiting search range to contract deployment block (not genesis) improves performance
- No caching for MVP (keep it simple)

**Integration with Existing Code:**
- Hook will be placed in `frontend/src/hooks/useBlockLookup.ts`
- Integration with `CapTable.tsx` page component
- Use existing `Input` component for datetime-local input
- Use existing `Button` component for actions
- Use existing `StatusIndicator` component for loading/error states and progress feedback

---

## Epic List

### Epic 1: Block Number Lookup by Date/Time

Enable users to find a blockchain block number by entering a date and time, then use that block number to query historical cap-table data. This epic includes the block lookup algorithm, UI integration with the Cap Table page, timezone handling, and error handling for edge cases.

---

## Epic 1: Block Number Lookup by Date/Time

**Goal:** Enable users to find a blockchain block number by entering a date and time, then use that block number to query historical cap-table data. This epic includes the block lookup algorithm, UI integration with the Cap Table page, timezone handling, and error handling for edge cases.

### Story 1.1: Implement Block Lookup Algorithm and Utilities

**As a** developer,  
**I want** block lookup utility functions that can find a block number by timestamp,  
**so that** the application can convert user-provided date/time to block numbers.

**Acceptance Criteria:**
1. Create utility function `findBlockByTimestamp` that implements binary search algorithm to find the latest block with timestamp ≤ target timestamp
2. Create utility function `getContractDeploymentBlock` that finds the contract deployment block number by querying the contract's creation transaction
3. Binary search algorithm must efficiently search between contract deployment block and current block
4. Algorithm must handle edge cases: future dates (return error), dates before contract deployment (return error)
5. Algorithm must return the exact block number (latest block with timestamp ≤ target)
6. Utility functions must use ethers.js v6 API consistently
7. Functions must be placed in `frontend/src/lib/blockLookup.ts`
8. Functions must include TypeScript types and JSDoc comments

### Story 1.2: Create Block Lookup React Hook

**As a** developer,  
**I want** a React hook `useBlockLookup` that manages block lookup state and operations,  
**so that** the UI can easily integrate block lookup functionality.

**Acceptance Criteria:**
1. Create `useBlockLookup` hook in `frontend/src/hooks/useBlockLookup.ts`
2. Hook must manage state: loading, error, result (block number, timestamp), progress indicator
3. Hook must expose `lookupBlock` function that accepts date/time string and performs lookup
4. Hook must detect browser timezone using `Intl.DateTimeFormat().resolvedOptions().timeZone`
5. Hook must convert user's date/time (local timezone) to Unix timestamp (UTC) for blockchain queries
6. Hook must convert found block's timestamp back to user's timezone for display
7. Hook must show progress during binary search (e.g., current search range)
8. Hook must handle errors gracefully and provide user-friendly error messages
9. Hook must use existing `ethers.BrowserProvider` pattern for blockchain queries
10. Hook must follow existing hook patterns (similar to `useCapTable`, `useExecuteSplit`)

### Story 1.3: Integrate Block Lookup UI into Cap Table Page

**As a** user,  
**I want** to enter a date and time to find a block number,  
**so that** I can query historical cap-table data at that point in time.

**Acceptance Criteria:**
1. Add `datetime-local` input field next to existing block number input on Cap Table page
2. Display user's timezone inline with the date input (e.g., "Your timezone: EST")
3. When user selects date/time, automatically trigger block lookup
4. Display progress indicator during lookup (using existing `StatusIndicator` component)
5. After successful lookup, display found block number and its timestamp (in user's timezone)
6. Automatically populate the block number input field with found block number
7. User can click existing "Refresh" button to query cap-table data with found block
8. Display error messages for invalid inputs (future dates, before contract deployment, network errors)
9. Maintain existing block number input functionality (users can still enter block numbers directly)
10. UI must use existing component library (Input, Button, StatusIndicator, Card)
11. UI must follow existing styling patterns (Tailwind CSS v4, dark theme)

### Story 1.4: Add Error Handling and Edge Cases

**As a** user,  
**I want** clear error messages when block lookup fails,  
**so that** I understand what went wrong and how to fix it.

**Acceptance Criteria:**
1. Display user-friendly error message when date/time is in the future: "The selected date/time is in the future. Please select a past date."
2. Display user-friendly error message when date/time is before contract deployment: "The selected date/time is before the contract was deployed. Please select a later date."
3. Display user-friendly error message for network errors: "Network error occurred. Please check your connection and try again."
4. Display user-friendly error message for RPC rate limiting: "Too many requests. Please wait a moment and try again."
5. All error messages must be accessible (announced to screen readers)
6. Error messages must allow retry (user can try lookup again)
7. Error messages must use existing `StatusIndicator` component with error variant
8. Error handling must not crash the application

### Story 1.5: Testing and Validation

**As a** developer,  
**I want** comprehensive tests for block lookup functionality,  
**so that** the feature works correctly and reliably.

**Acceptance Criteria:**
1. Test binary search algorithm with mock block data (unit tests)
2. Test contract deployment block detection (integration test with local Hardhat network)
3. Test timezone conversion logic (unit tests)
4. Test edge cases: future dates, before contract deployment, network errors
5. Test UI integration: date/time input, progress indicator, error messages
6. Test with different timezones (manual testing)
7. Test with Hardhat local network and Sepolia testnet (manual testing)
8. Verify end-to-end flow: enter date/time → find block → query cap-table
9. Verify accessibility: keyboard navigation, screen reader announcements
10. All tests must pass before feature is considered complete

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 95% - The PRD is comprehensive and well-structured for a focused feature addition.

**MVP Scope Appropriateness:** Just Right - The scope is appropriately minimal and focused on delivering the core feature value.

**Readiness for Architecture Phase:** Ready - The PRD provides sufficient technical detail for architecture design to proceed.

**Most Critical Gaps or Concerns:** None - The PRD is ready for implementation.

### Category Analysis Table

| Category                         | Status | Critical Issues |
| -------------------------------- | ------ | --------------- |
| 1. Problem Definition & Context | PASS   | None            |
| 2. MVP Scope Definition          | PASS   | None            |
| 3. User Experience Requirements  | PASS   | None            |
| 4. Functional Requirements       | PASS   | None            |
| 5. Non-Functional Requirements   | PASS   | None            |
| 6. Epic & Story Structure        | PASS   | None            |
| 7. Technical Guidance            | PASS   | None            |
| 8. Cross-Functional Requirements | PASS   | None            |
| 9. Clarity & Communication       | PASS   | None            |

### Detailed Category Analysis

**1. Problem Definition & Context - PASS**
- ✅ Problem statement is clear: users need date/time-based block lookup instead of requiring block numbers
- ✅ Target audience is specific: users of the Cap Table feature
- ✅ Background context explains why this problem exists
- ✅ Goals are measurable and achievable
- Note: This is a feature addition, not a new product, so full problem definition is appropriate

**2. MVP Scope Definition - PASS**
- ✅ Core functionality is clearly defined
- ✅ Features directly address the problem statement
- ✅ Scope boundaries are clear (no caching, simple implementation)
- ✅ MVP is appropriately minimal while still viable
- ✅ Future enhancements can be added later

**3. User Experience Requirements - PASS**
- ✅ User flows are documented (date/time input → lookup → use block)
- ✅ UI requirements are specific (datetime-local input, timezone display)
- ✅ Accessibility requirements are included (WCAG AA)
- ✅ Error handling is planned
- ✅ Integration with existing UI is clear

**4. Functional Requirements - PASS**
- ✅ 11 functional requirements comprehensively cover the feature
- ✅ Requirements are testable and specific
- ✅ Edge cases are addressed (future dates, before deployment)
- ✅ Requirements focus on WHAT not HOW
- ✅ Terminology is consistent

**5. Non-Functional Requirements - PASS**
- ✅ Performance requirements are defined (10 seconds)
- ✅ Error handling requirements are specified
- ✅ Network compatibility is addressed (Hardhat, Sepolia)
- ✅ User experience requirements are clear
- ✅ No security concerns for this feature

**6. Epic & Story Structure - PASS**
- ✅ Single epic is appropriate for this focused feature
- ✅ Stories are logically sequenced (utilities → hook → UI → errors → testing)
- ✅ Stories are appropriately sized (2-4 hours each)
- ✅ Acceptance criteria are testable and specific
- ✅ Stories deliver independent value

**7. Technical Guidance - PASS**
- ✅ Technical approach is clear (binary search, React hooks)
- ✅ Integration points are identified (Cap Table page, existing components)
- ✅ Performance considerations are documented
- ✅ Technical constraints are specified (ethers.js v6, existing patterns)
- ✅ Algorithm approach is well-defined

**8. Cross-Functional Requirements - PASS**
- ✅ Integration with existing codebase is clear
- ✅ Component reuse is specified
- ✅ Testing requirements are comprehensive
- ✅ No external system integrations needed
- ✅ Operational requirements are minimal (frontend-only)

**9. Clarity & Communication - PASS**
- ✅ Document is well-structured and organized
- ✅ Technical terms are defined
- ✅ Language is clear and consistent
- ✅ Sections flow logically
- ✅ Next steps are provided

### Top Issues by Priority

**BLOCKERS:** None

**HIGH:** None

**MEDIUM:** None

**LOW:** 
- Consider adding a diagram showing the binary search algorithm flow
- Could include example user scenarios for clarity

### MVP Scope Assessment

**Features Included:**
- ✅ Block lookup by date/time
- ✅ Timezone handling
- ✅ Progress indicator
- ✅ Error handling
- ✅ UI integration

**Features Excluded (Appropriately):**
- ✅ Caching (deferred for MVP)
- ✅ Timezone selection (using browser timezone only)
- ✅ Keyboard shortcuts (not commonly used)

**Complexity Assessment:**
- Binary search algorithm: Medium complexity, well-documented
- Contract deployment block detection: Medium complexity, approach is clear
- UI integration: Low complexity, uses existing components
- Overall: Appropriate complexity for MVP

**Timeline Realism:**
- 5 stories, each 2-4 hours = 10-20 hours total
- Realistic for a focused feature addition
- Stories are appropriately sized

### Technical Readiness

**Clarity of Technical Constraints:**
- ✅ ethers.js v6 API specified
- ✅ React hooks pattern specified
- ✅ Existing component library specified
- ✅ Binary search algorithm approach documented

**Identified Technical Risks:**
- Binary search performance for very old dates (mitigated by progress indicator)
- RPC rate limiting (mitigated by efficient algorithm)
- Contract deployment block detection (approach is clear)

**Areas Needing Architect Investigation:**
- Binary search implementation details (optimization opportunities)
- Contract deployment block detection method (best approach)
- Progress indicator implementation (how to show search range)

### Recommendations

**Strengths:**
1. Clear problem statement and solution
2. Well-structured stories with clear acceptance criteria
3. Good technical guidance for implementation
4. Appropriate MVP scope
5. Comprehensive error handling

**Suggestions for Improvement:**
1. Consider adding a visual diagram of the binary search algorithm flow
2. Could include example user scenarios (e.g., "User wants to see cap table as of Dec 31, 2023")
3. Consider documenting the expected number of RPC calls for typical queries

**Next Steps:**
1. ✅ PRD is ready for architecture phase
2. Architect should review binary search implementation details
3. Architect should confirm contract deployment block detection approach
4. Proceed with implementation following the stories in sequence

### Final Decision

**READY FOR ARCHITECT**

The PRD is comprehensive, well-structured, and ready for architectural design. All requirements are clear, testable, and appropriately scoped for MVP. The technical approach is sound, and the stories are well-defined for implementation.

---

## Next Steps

### Architect Prompt

Create architecture documentation for the block number lookup by date/time feature. The feature should integrate with the existing Cap Table page and use a binary search algorithm to find blocks by timestamp. Review the PRD above and create technical architecture documentation that includes:

- Block lookup algorithm design (binary search implementation)
- Contract deployment block detection approach
- React hook architecture (`useBlockLookup`)
- UI component integration with existing Cap Table page
- Error handling and edge case strategies
- Performance considerations and optimization opportunities

Use the existing codebase patterns (ethers.js v6, React hooks, Tailwind CSS v4) and ensure consistency with current architecture.

