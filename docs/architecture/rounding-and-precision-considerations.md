# Rounding and Precision Considerations

### Potential Rounding Issues

**1. Ownership Percentage Calculation:**
- **Issue:** JavaScript `number` type has ~15-17 significant digits precision
- **Risk:** When calculating `(balance / totalSupply) * 100`, precision can be lost for large numbers
- **Solution:** Use BigNumber division with fixed decimal precision, store as string

**2. Multiplier Storage:**
- **Issue:** Multiplier stored as `number` in TypeScript interface
- **Risk:** If multiplier becomes very large, JavaScript number precision loss
- **Solution:** Store multiplier as string (BigNumber) in TypeScript

**3. Percentage Sum Validation:**
- **Issue:** Individual percentages may not sum to exactly 100% due to rounding
- **Risk:** Users may notice percentages don't add up to 100%
- **Solution:** Document rounding behavior, use consistent precision, optionally show rounding note

### Solutions Implemented

**Smart Contract (No Issues):**
- All balances stored as `uint256` (no decimal places, no rounding)
- Multiplier stored as `uint256` (no rounding issues)
- All arithmetic uses integer math (no precision loss)

**Frontend/Backend (TypeScript):**
- Store all balances as strings (BigNumber serialization)
- Calculate percentages using BigNumber division with high precision
- Format percentages as strings with fixed 6 decimal places
- Never convert large BigNumbers to JavaScript `number` type

**Example Percentage Calculation:**
```typescript
// ❌ BAD: Precision loss with JavaScript numbers
const percentage = (balance / totalSupply) * 100; // JavaScript number - loses precision!

// ✅ GOOD: High precision with BigNumber
const balanceBN = ethers.BigNumber.from(balance);
const totalSupplyBN = ethers.BigNumber.from(totalSupply);
const PRECISION = ethers.BigNumber.from(10).pow(6); // 6 decimal places

const percentageScaled = balanceBN
  .mul(100)           // Convert to percentage
  .mul(PRECISION)     // Scale for precision
  .div(totalSupplyBN);

const percentageStr = ethers.utils.formatUnits(percentageScaled, 6); // "12.345678"
```

---
