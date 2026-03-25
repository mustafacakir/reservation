-- Row Level Security setup (defense in depth)
-- This runs once when the container initializes

-- Note: Tables are created by EF Core migrations.
-- RLS policies are applied post-migration via this script or via migration seeder.

-- Example RLS policy (applied after EF Core creates the table):
-- ALTER TABLE "Bookings" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON "Bookings"
--   USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- For now, ensure the extensions we need are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search on bio/name
