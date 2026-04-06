# OmniBIZ

Multi-tenant POS & Billing SaaS for Indian retailers.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI primitives
- **State**: Zustand (POS), TanStack React Query (server)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **ORM**: Prisma 5 (compatible with Node 20)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp src/.env.local.example src/.env.local

# Set up Supabase and update .env.local with your credentials

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth pages (login, signup)
    (dashboard)/           # Protected dashboard pages
    (onboarding)/          # Store setup wizard
  components/
    ui/                   # shadcn/ui components
    pos/                  # POS-specific components
  lib/
    supabase/             # Supabase client helpers
    db.ts                 # Prisma client
  stores/                 # Zustand stores
  types/                  # TypeScript types
prisma/
  schema.prisma           # Database schema
```

## Features

- Multi-tenant SaaS with per-store subscription tiers
- GST-compliant billing (B2C, B2B, e-invoice ready)
- Inventory with batch, expiry, serial number tracking
- Restaurant support (tables, KOT, BOM/combos)
- Multi-store, multi-location management
- Role-based personas (Admin, Manager, Billing, etc.)
- Export to Excel/CSV
- Offline-capable POS
