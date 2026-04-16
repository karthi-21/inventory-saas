#!/bin/bash
# Apply RLS policies to Supabase database
# Usage: bash scripts/apply-rls.sh
#
# This enables Row Level Security on all tables and creates tenant isolation policies.
# The service role key (used by Prisma) bypasses RLS, so API routes continue working.
# RLS protects against direct client access using anon/auth keys.

set -e

echo "⚠️  This will enable RLS and create tenant isolation policies on ALL tables."
echo "   The service role key bypasses RLS, so Prisma queries are unaffected."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

# Use direct connection (not pgbouncer) for DDL operations
DIRECT_URL="${DATABASE_URL?pgbouncer=true/}"
DIRECT_URL="${DIRECT_URL/?pgbouncer=true/}"

echo "Applying RLS policies..."
psql "$DIRECT_URL" -f prisma/rls/tenant_isolation.sql

echo ""
echo "✅ RLS policies applied successfully!"
echo "   - RLS enabled on all tables"
echo "   - Tenant isolation policies created"
echo "   - Service role key still bypasses RLS (Prisma unaffected)"
echo "   - Anon/auth key queries now filtered by tenant"