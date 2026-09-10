const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSyncEventDays() {
  console.log('=== CHECKING IF event_days CAN BE SYNCED / READ ===');
  
  // Fetch from college_events
  const { data: events } = await supabase.from('college_events').select('*');
  for (const ev of events) {
    console.log(`Event: ${ev.college_name} (${ev.id})`);
    const sc = ev.social_coverage || {};
    const scDays = sc.event_days || [];
    console.log(`  sc.event_days:`, scDays.length);
    for (const d of scDays) {
      console.log(`    Day ${d.day_number}: id=${d.id} name=${d.name} status=${d.status}`);
    }
  }

  // Check event_days table again
  const { data: edRows, error } = await supabase.from('event_days').select('*');
  console.log('event_days count:', edRows?.length, 'error:', error);
}

testSyncEventDays().catch(console.error);
