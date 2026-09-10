const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllEventDays() {
  console.log('=== SYNCING ALL LEGITIMATE EVENT DAYS TO public.event_days ===');

  const { data: events, error: evErr } = await supabase.from('college_events').select('*');
  if (evErr) {
    console.error('Failed to fetch events:', evErr);
    return;
  }

  for (const ev of events) {
    console.log(`\nEvent: ${ev.college_name} (${ev.id})`);
    const sc = ev.social_coverage || {};
    const scDays = sc.event_days || [];
    console.log(`  Found ${scDays.length} days in social_coverage`);

    if (scDays.length > 0) {
      for (const d of scDays) {
        console.log(`  Upserting Day ${d.day_number}: ${d.name} (${d.id})...`);
        const { data: upserted, error: upErr } = await supabase.from('event_days').upsert({
          id: d.id,
          event_id: ev.id,
          day_number: d.day_number,
          name: d.name || `Day ${d.day_number}`,
          status: d.status || (d.day_number === 1 ? 'Active' : 'Upcoming'),
          activities: d.activities || [],
          order_index: d.order_index ?? (d.day_number - 1),
          is_archived: !!d.is_archived
        }, { onConflict: 'id' }).select();

        console.log(`    Result:`, upserted, `Error:`, upErr);
      }
    }
  }

  const { data: allEd } = await supabase.from('event_days').select('*');
  console.log('\nFinal rows in public.event_days table:', allEd);
}

syncAllEventDays().catch(console.error);
