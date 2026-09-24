import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAccess() {
  console.log('Testing Supabase connection...');
  
  // Test college_events
  const { data: events, error: evErr, count: evCount } = await supabase
    .from('college_events')
    .select('*', { count: 'exact' });
  console.log('college_events count:', evCount ?? events?.length, 'error:', evErr?.message);

  // Test storage
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Storage buckets:', buckets, 'error:', bErr?.message);

  // Test tables
  const tables = [
    'college_events', 'event_participants', 'learners', 'coordinators',
    'political_parties', 'committees', 'session_agenda', 'jury_members',
    'volunteers', 'event_deadlines', 'proceedings_questions', 'proceedings_motions',
    'event_days', 'day_activities', 'event_day_attendance', 'login_records',
    'learner_allocation_confirmations', 'team_members', 'checklist_items',
    'speaking_requests', 'speaking_turns'
  ];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${t}: Error: ${error.message} (${error.code})`);
    } else {
      console.log(`Table ${t}: ${count} rows`);
    }
  }

  // Test if any RPC exists for raw sql or db size
  const rpcTests = ['exec_sql', 'run_sql', 'get_db_size', 'pg_database_size', 'query'];
  for (const r of rpcTests) {
    const { data, error } = await supabase.rpc(r);
    if (!error || !error.message.includes('Could not find the function')) {
      console.log(`RPC ${r}:`, data, error?.message);
    }
  }
}

testAccess().catch(console.error);
