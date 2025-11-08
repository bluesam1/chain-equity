# External APIs

### Supabase Web3 Auth API

- **Purpose:** User authentication and session management
- **Documentation:** https://supabase.com/docs/guides/auth/web3
- **Base URL:** `https://[project-ref].supabase.co`
- **Authentication:** API key (anon key) + wallet signature
- **Rate Limits:** Supabase free tier limits apply

**Key Endpoints Used:**
- `POST /auth/v1/verify` - Verify wallet signature
- `POST /auth/v1/token` - Create session token
- `GET /auth/v1/user` - Get current user

**Integration Notes:**
- Supabase handles wallet signature verification
- Sessions stored in Supabase
- Frontend uses Supabase client for auth state

### Blockchain RPC API

- **Purpose:** Query blockchain state and send transactions
- **Base URL:** 
  - Local: `http://localhost:8545` (Hardhat)
  - Sepolia: `https://sepolia.infura.io/v3/[key]` or similar
- **Authentication:** None for public RPC, API key for Infura/Alchemy
- **Rate Limits:** Provider-dependent

**Key Methods Used:**
- `eth_getBlockByNumber` - Get block information
- `eth_getLogs` - Query events
- `eth_call` - Call view functions
- `eth_sendTransaction` - Send transactions

**Integration Notes:**
- ethers.js abstracts RPC calls
- Provider configured via environment variables
- Fallback providers can be configured for reliability

---
