const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';

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
