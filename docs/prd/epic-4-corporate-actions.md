# Epic 4: Corporate Actions

## Overview

Implementation of stock split and symbol change corporate actions.

---

## Corporate Actions (Required: Both)

### Action 1: 7-for-1 Stock Split

- [ ] Multiply all balances by 7
- [ ] Maintain proportional ownership
- [ ] Update total supply accordingly
- [ ] Emit event documenting split
- [ ] Document implementation approach and tradeoffs

### Action 2: Symbol/Ticker Change

- [ ] Change token symbol (e.g., "OLD" → "NEW")
- [ ] Preserve all balances and ownership
- [ ] Update metadata visible to explorers/wallets
- [ ] Emit event documenting change
- [ ] Document implementation approach and tradeoffs

---

## Corporate Actions Implementation

### Implementation Requirements

- [ ] Implement virtual split function (update multiplier)
- [ ] Test split: balances scale, ownership % unchanged
- [ ] Implement mutable symbol change function
- [ ] Test symbol updates, balances preserved
- [ ] Document implementation approach

