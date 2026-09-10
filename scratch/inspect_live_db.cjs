const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
  console.log('=== INSPECTING LIVE SUPABASE DATABASE ===\n');

  // 1. Fetch events
  const { data: events, error: evErr } = await supabase.from('college_events').select('id, college_name, slug, social_coverage');
  console.log('[1] College Events:', events?.length, 'error:', evErr);
  events?.forEach(e => {
    console.log(`Event ID: ${e.id} | Name: ${e.college_name} | Slug: ${e.slug}`);
    const sc = e.social_coverage || {};
    console.log('  social_coverage.event_days:', JSON.stringify(sc.event_days || []));
    console.log('  social_coverage.day_attendance count:', (sc.day_attendance || []).length);
  });

  // 2. Fetch event_days table
  const { data: eventDays, error: edErr } = await supabase.from('event_days').select('*');
  console.log('\n[2] event_days rows:', eventDays?.length, 'error:', edErr);
  eventDays?.forEach(d => {
    console.log(`  Row -> id: ${d.id} | event_id: ${d.event_id} | day_number: ${d.day_number} | name: ${d.name} | status: ${d.status}`);
  });

  // 3. Fetch event_day_attendance table
  const { data: attRecords, error: attErr } = await supabase.from('event_day_attendance').select('*').limit(20);
  console.log('\n[3] event_day_attendance sample rows (first 20):', attRecords?.length, 'error:', attErr);
  attRecords?.forEach(a => {
    console.log(`  Att -> id: ${a.id} | event_id: ${a.event_id} | day_id: ${a.day_id} | event_day_id: ${a.event_day_id} | student_id: ${a.student_id} | status: ${a.status}`);
  });

  // 4. Check if 2d56f252-391d-41f5-9dcd-2e0504fc4d4b exists anywhere
  console.log('\n[4] Checking for 2d56f252-391d-41f5-9dcd-2e0504fc4d4b in event_days...');
  const matchDay = eventDays?.find(d => d.id === '2d56f252-391d-41f5-9dcd-2e0504fc4d4b');
  console.log('  Match in event_days:', matchDay || 'NOT FOUND');

  // 5. Learners sample
  const { data: learners, error: lErr } = await supabase.from('learners').select('id, full_name, event_id, day1_checked_in, day2_checked_in').limit(5);
  console.log('\n[5] Learners sample:', learners?.length, 'error:', lErr);
  learners?.forEach(l => {
    console.log(`  Learner -> id: ${l.id} | name: ${l.full_name} | event_id: ${l.event_id} | day1: ${l.day1_checked_in} | day2: ${l.day2_checked_in}`);
  });
}

inspectDb().catch(console.error);
