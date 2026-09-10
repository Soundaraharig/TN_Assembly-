const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('=== CHECKING COLUMNS FOR event_days AND event_day_attendance ===');

  // Let's inspect an insert and rollback or test with invalid column to see valid column names
  // In Supabase, if you select non-existent column, PostgREST returns the error with hint or list
  const { data: d1, error: e1 } = await supabase.from('event_days').select('id, event_id, day_number, name, date, status, activities, is_archived, order_index, created_at, updated_at').limit(1);
  console.log('event_days standard columns error:', e1 ? e1.message : 'ALL VALID!');

  const { data: d2, error: e2 } = await supabase.from('event_days').select('day_id').limit(1);
  console.log('does event_days have day_id column?:', e2 ? e2.message : 'YES it has day_id');

  const { data: d3, error: e3 } = await supabase.from('event_day_attendance').select('id, event_id, day_id, event_day_id, student_id, participant_id, status, marked_by, marked_by_role, marked_at, created_at, updated_at').limit(1);
  console.log('event_day_attendance columns error:', e3 ? e3.message : 'ALL VALID!');
}

checkColumns().catch(console.error);
