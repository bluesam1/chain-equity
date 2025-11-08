# Database Schema

**Note:** This project does not use a traditional database for cap-table data. All token ownership data is derived from blockchain events. Supabase is used only for user authentication and session management.

### Supabase Authentication Schema

Supabase automatically manages the following tables for Web3 authentication:

**auth.users** (Managed by Supabase):
- `id`: uuid (primary key)
- `wallet_address`: text (indexed)
- `created_at`: timestamp
- `updated_at`: timestamp

**auth.sessions** (Managed by Supabase):
- `id`: uuid (primary key)
- `user_id`: uuid (foreign key to auth.users)
- `token`: text
- `expires_at`: timestamp
- `created_at`: timestamp

**Optional: Custom User Profiles Table** (if needed):
```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---
