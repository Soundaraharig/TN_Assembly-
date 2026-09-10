const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('=== CHECKING COLLEGE EVENTS ===');
  const { data: events, error: evErr } = await supabase.from('college_events').select('*');
  if (evErr) console.error('Error fetching events:', evErr);
  events.forEach(e => {
    console.log(`\nEvent: "${e.college_name}" | ID: ${e.id} | is_locked: ${e.is_locked} | slug: ${e.slug}`);
    console.log('  social_coverage keys:', Object.keys(e.social_coverage || {}));
    console.log('  sc.allocation_lock:', e.social_coverage?.allocation_lock);
    console.log('  sc.registrations_frozen:', e.social_coverage?.registrations_frozen);
    console.log('  sc.cabinet_ministries:', e.social_coverage?.cabinet_ministries);
    console.log('  sc.leadership_roles:', e.social_coverage?.leadership_roles);
    console.log('  sc.elections length:', (e.social_coverage?.elections || []).length);
    if ((e.social_coverage?.elections || []).length > 0) {
      console.log('  elections sample:', JSON.stringify(e.social_coverage.elections.slice(0, 3)));
    }
  });

  console.log('\n=== CHECKING LEARNERS WITH NON-MLA ROLES ===');
  const { data: learners, error: lErr } = await supabase.from('learners').select('id, full_name, event_id, role, access_code, constituency_name').neq('role', 'Member of Legislative Assembly (MLA)');
  if (lErr) console.error('Error fetching learners:', lErr);
  console.log(`Found ${learners.length} non-MLA learners:`);
  learners.forEach(l => {
    console.log(`  Event: ${l.event_id} | Role: "${l.role}" | Name: ${l.full_name} (${l.access_code}) | Const: ${l.constituency_name}`);
  });

  console.log('\n=== CHECKING TABLES IN SCHEMA (BY QUERYING CANDIDATES) ===');
  const candidateTables = ['elections', 'election_results', 'nominations', 'ballots', 'votes', 'cabinet_ministries', 'portfolios'];
  for (const t of candidateTables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table "${t}":`, error ? `error: ${error.message} (${error.code})` : `exists, rows: ${data?.length}`);
  }
}

check().catch(console.error);
