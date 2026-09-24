-- ====================================================================
-- SUPABASE CLUSTER ROLES REFERENCE
-- Dump Date: 2026-09-24T11:01:36.985Z
-- Source Project Ref: svtjphzbuicnirynorlx
-- Note: In managed Supabase environments, cluster roles are created and
-- maintained by the platform. The application relies on standard roles:
-- anon, authenticated, service_role, postgres, supabase_admin.
-- ====================================================================

DO $$
BEGIN
  -- Grant standard role permissions on public schema
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
END $$;
