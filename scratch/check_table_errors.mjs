import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkNullTables() {
  const tables = [
    'event_participants', 'event_deadlines', 'proceedings_questions',
    'proceedings_motions', 'login_records', 'speaking_requests', 'speaking_turns'
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, { error: error?.message, code: error?.code, status: error?.status, dataLength: data?.length });
  }
}

checkNullTables().catch(console.error);
