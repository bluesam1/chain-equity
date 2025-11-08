# Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Firebase Hosting
- **Build Command:** `npm run build` (Vite build)
- **Output Directory:** `frontend/dist`
- **CDN/Edge:** Firebase Hosting global CDN

**Smart Contract Deployment:**
- **Platform:** Hardhat Network (local) / Sepolia Testnet (stretch goal)
- **Deployment Script:** `scripts/deploy.ts` (TypeScript)
- **Verification:** Etherscan verification for Sepolia (stretch goal)

### Environments

| Environment | Frontend URL | Blockchain | Purpose |
|-------------|--------------|------------|---------|
| Development | `http://localhost:5173` (Vite dev server) | `http://localhost:8545` | Local development |
| Staging | Firebase Hosting URL | Sepolia Testnet | Pre-production testing |
| Production | Firebase Hosting URL | Sepolia Testnet | Public demo |

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml (stretch goal)
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

