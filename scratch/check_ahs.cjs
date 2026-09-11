const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.trim().split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[k] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkAhs() {
  const { data: events } = await supabase.from('college_events').select('*').ilike('college_name', '%ahs%');
  console.log('AHS events:', events?.map(e => ({ id: e.id, name: e.college_name })));

  if (events && events.length > 0) {
    const evId = events[0].id;
    const { data: learners } = await supabase.from('learners').select('id, full_name, role, party_name, bench, constituency_number').eq('event_id', evId);
    console.log(`Learners in ${events[0].college_name}: ${learners?.length}`);
    const nonMla = learners?.filter(l => l.role && l.role !== 'Member of Legislative Assembly (MLA)' && l.role !== 'MLA');
    console.log('Non-MLA roles count:', nonMla?.length);
    nonMla?.forEach(l => console.log(`  - ${l.full_name}: "${l.role}" (${l.bench})`));
  }
}

checkAhs();
