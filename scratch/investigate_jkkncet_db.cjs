const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateDb() {
  console.log('=== INVESTIGATING SUPABASE DATA FOR JKKNCET & EVENTS ===\n');

  // 1. Check all events
  const { data: events, error: evErr } = await supabase.from('college_events').select('*');
  console.log('--- [1] ALL COLLEGE EVENTS IN DATABASE ---');
  events?.forEach(ev => {
    console.log(`\nID: ${ev.id}`);
    console.log(`College Name: ${ev.college_name}`);
    console.log(`Slug: ${ev.slug}`);
    console.log(`Location: ${ev.location} | Level: ${ev.level}`);
    console.log(`Coordinator: ${ev.assigned_coordinator_name} (${ev.assigned_coordinator_email})`);
    console.log(`is_locked: ${ev.is_locked} | participant_count: ${ev.participant_count}`);
    const sc = ev.social_coverage || {};
    console.log(`social_coverage keys:`, Object.keys(sc));
    console.log(`  allocation_lock:`, sc.allocation_lock);
    console.log(`  registrations_frozen:`, sc.registrations_frozen);
    console.log(`  scores_locked:`, sc.scores_locked);
    console.log(`  cabinet_ministries count:`, (sc.cabinet_ministries || []).length);
    console.log(`  cabinet_ministries preview:`, JSON.stringify((sc.cabinet_ministries || []).slice(0, 3)));
    console.log(`  leadership_roles:`, JSON.stringify(sc.leadership_roles || {}));
    console.log(`  elections count:`, (sc.elections || []).length);
    if ((sc.elections || []).length > 0) {
      console.log(`  elections sample:`, JSON.stringify(sc.elections.slice(0, 2)));
    }
  });

  // 2. Check if there are tables for elections or cabinet
  console.log('\n--- [2] CHECKING RELATED TABLES ---');
  const tables = ['elections', 'cabinet_ministries', 'nominations', 'flash_votes', 'bill_proceedings'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(5);
    console.log(`Table "${t}": exists=${!error}, count=${data?.length}, error=${error?.message}`);
  }

  // 3. Check learners for JKKNCET
  const jkkncetId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { count: jkkncetLearnersCount } = await supabase
    .from('learners')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', jkkncetId);
  console.log(`\n--- [3] LEARNERS FOR JKKNCET (${jkkncetId}): count = ${jkkncetLearnersCount} ---`);

  // Check if any learner has 20ffdd74...
  const { count: typoCount } = await supabase
    .from('learners')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', '20ffdd74-4d21-44d5-9f63-9a07bf267824');
  console.log(`Learners with event_id 20ffdd74...: ${typoCount}`);
}

investigateDb().catch(console.error);
