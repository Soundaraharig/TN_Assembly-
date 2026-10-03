import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qyijhztjvxansctqhpkd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY) as string;

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
