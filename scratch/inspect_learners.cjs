const { createClient } = require('@supabase/supabase-js');
const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

async function inspect() {
  console.log('--- 1. College Events ---');
  const { data: events, error: evErr } = await sb.from('college_events').select('id, college_name, slug, created_at');
  if (evErr) console.error('Events err:', evErr.message);
  else console.table(events);

  console.log('\n--- 2. Learners Count by event_id ---');
  const { data: learners, error: lErr } = await sb.from('learners').select('id, access_code, full_name, event_id, party_name, bench, constituency_number, constituency_name, committee_name, role, created_at');
  if (lErr) {
    console.error('Learners err:', lErr.message);
    return;
  }
  
  console.log('Total learners:', learners.length);
  const byEvent = {};
  for (const l of learners) {
    const eid = l.event_id || 'NULL_EVENT_ID';
    if (!byEvent[eid]) byEvent[eid] = { count: 0, withParty: 0, withConst: 0, withComm: 0 };
    byEvent[eid].count++;
    if (l.party_name) byEvent[eid].withParty++;
    if (l.constituency_number) byEvent[eid].withConst++;
    if (l.committee_name) byEvent[eid].withComm++;
  }
  console.table(byEvent);

  console.log('\n--- 3. Sample learners with NULL event_id or changed recently ---');
  const nullOrEmpty = learners.filter(l => !l.event_id || !l.party_name || !l.constituency_number);
  console.log('Learners with missing party or constituency:', nullOrEmpty.length);
  console.table(nullOrEmpty.slice(0, 15).map(l => ({
    id: l.id,
    access_code: l.access_code,
    name: l.full_name,
    event_id: l.event_id,
    party: l.party_name,
    bench: l.bench,
    const_no: l.constituency_number,
    comm: l.committee_name,
    role: l.role
  })));

  console.log('\n--- 4. Check learners single row columns ---');
  const { data: single, error: sErr } = await sb.from('learners').select('*').limit(1);
  if (sErr) console.error('Single row err:', sErr.message);
  else if (single && single[0]) {
    console.log('Columns in learners table:', Object.keys(single[0]));
    console.log('Sample row data:', single[0]);
  }

  console.log('\n--- 5. Check if event_participants table exists and has rows ---');
  const { data: ep, error: epErr } = await sb.from('event_participants').select('*').limit(5);
  if (epErr) console.log('event_participants table:', epErr.message);
  else {
    console.log('event_participants count found:', ep.length);
    if (ep.length > 0) console.table(ep);
  }
}

inspect().catch(console.error);
