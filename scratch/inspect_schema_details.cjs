const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('=== INSPECTING COLUMNS AND CONSTRAINTS ===');

  // Let's test what columns event_days has by doing an insert test with returning or selecting
  const { data: edCols, error: edErr } = await supabase.from('event_days').select('*').limit(1);
  console.log('event_days query success:', !edErr, edErr ? edErr.message : '');

  const { data: attCols, error: attErr } = await supabase.from('event_day_attendance').select('*').limit(1);
  console.log('event_day_attendance query success:', !attErr, attErr ? attErr.message : '');

  // Let's check college_events
  const { data: evs } = await supabase.from('college_events').select('id, college_name');
  console.log('Events in DB:', evs);
}

inspectSchema().catch(console.error);
