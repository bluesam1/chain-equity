# Testing Strategy

### Testing Pyramid

```
        E2E Tests
       /        \
   Integration Tests
   /            \
Contract Unit  Service Unit
```

### Test Organization

**Contract Tests:**
```
test/
├── ChainEquityToken.test.ts
│   ├── Deployment tests
│   ├── Transfer tests (allowlist)
│   ├── Mint tests
│   ├── Split tests
│   └── Symbol change tests
```

**Service Tests:**
```
backend/__tests__/
├── cap-table.test.ts
└── issuer.test.ts
```

**E2E Tests:**
```
e2e/
├── auth.spec.ts
├── admin-operations.spec.ts
└── cap-table-export.spec.ts
```

### Test Examples

**Contract Test Example:**
```typescript
describe('ChainEquityToken', () => {
  it('should block transfer to non-allowlisted address', async () => {
    await token.approveWallet(alice.address);
    await expect(
      token.connect(alice).transfer(bob.address, 100)
    ).to.be.revertedWith('Recipient not allowlisted');
  });
});
```

**Service Test Example:**
```typescript
describe('Cap-Table Service', () => {
  it('should generate accurate cap-table', async () => {
    const capTable = await generateCapTable(contractAddress);
    expect(capTable.holders).toHaveLength(2);
    expect(capTable.totalSupply).toBe('1000');
  });
});
```

---
