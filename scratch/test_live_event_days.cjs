const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventDaysTable() {
  console.log('=== TESTING EVENT_DAYS IN LIVE SUPABASE ===');

  // Let's check event 05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8 and 200fdd74-4d21-44d5-9f63-9a07bf267824
  const { data: evs, error: evErr } = await supabase.from('college_events').select('id, college_name, social_coverage');
  console.log('Events:', evs);

  for (const ev of evs) {
    const sc = ev.social_coverage || {};
    const scDays = sc.event_days || [];
    console.log(`Event ${ev.college_name} (${ev.id}) has ${scDays.length} days in social_coverage:`, scDays.map(d => ({ id: d.id, name: d.name, day_number: d.day_number })));
  }

  // Check what happens if we query event_days for either event
  const { data: edRows, error: edErr } = await supabase.from('event_days').select('*');
  console.log('event_days rows in DB:', edRows, 'Error:', edErr);
}

testEventDaysTable().catch(console.error);
