import { createClient } from '@supabase/supabase-js';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || (typeof process !== 'undefined' && process.env) || {};
const supabaseUrl = (metaEnv.VITE_SUPABASE_URL || '') as string;
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '') as string;

// Check if credentials are real (not placeholders)
const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-public-key-here';

if (!isConfigured) {
  console.warn(
    '[Supabase] Not configured — running in localStorage-only mode.\n' +
    'Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file to enable cloud sync.'
  );
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseEnabled = isConfigured;
