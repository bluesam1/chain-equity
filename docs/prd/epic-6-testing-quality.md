# Epic 6: Testing & Quality

## Overview

Testing scenarios, gas benchmarks, and success metrics.

---

## Required Test Scenarios

### Happy Path Tests
- [ ] Approve wallet → Mint tokens → Verify balance
- [ ] Transfer between two approved wallets → SUCCESS
- [ ] Execute 7-for-1 split → All balances × 7, total supply updates
- [ ] Change symbol → Metadata updates, balances unchanged
- [ ] Export cap-table at block N → Verify accuracy
- [ ] Export cap-table at block N+10 → Verify changes reflected

### Failure Tests
- [ ] Transfer from approved to non-approved → FAIL
- [ ] Transfer from non-approved to approved → FAIL
- [ ] Revoke approval → Previously approved wallet can no longer receive
- [ ] Unauthorized wallet attempts admin action → FAIL

---

## Gas Benchmarks (Target)

| Operation | Target Gas | Actual | Notes |
|-----------|-----------|--------|-------|
| Mint tokens | <100k | | |
| Approve wallet | <50k | | |
| Transfer (gated) | <100k | | |
| Revoke approval | <50k | | |
| Stock split (per holder) | Document | | |
| Symbol change | <50k | | |

---

## Success Metrics

| Category | Metric | Target | Status |
|----------|--------|--------|--------|
| Correctness | False-positive transfers | 0 | |
| Correctness | False-negative blocks | 0 | |
| Operability | Cap-table export works | ✓ | |
| Corporate Actions | Split + symbol change | Both work | |
| Performance | Transfer confirmation | Within norms | |
| Performance | Cap-table generation | <30s for typical chain | |
| Documentation | Rationale documented | Clear & justified | |

