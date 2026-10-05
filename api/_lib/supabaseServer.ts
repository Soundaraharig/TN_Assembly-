// api/_lib/supabaseServer.ts
// Server-side Supabase client using elevated service role when configured

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedServerClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cachedServerClient) return cachedServerClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Supabase URL not configured on server (SUPABASE_URL or VITE_SUPABASE_URL missing)');
  }

  const keyToUse = serviceKey || anonKey;
  if (!keyToUse) {
    throw new Error('No Supabase key available on server');
  }

  cachedServerClient = createClient(url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedServerClient;
}
