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

async function checkYuvaAssignments() {
  const { data: events, error } = await supabase.from('college_events').select('id, college_name, social_coverage');
  if (error) {
    console.error(error);
    return;
  }

  for (const ev of events) {
    const sc = ev.social_coverage || {};
    const yAssignments = sc.yuva_assignments;
    console.log(`Event: ${ev.college_name} (${ev.id})`);
    console.log(`  yuva_assignments count:`, Array.isArray(yAssignments) ? yAssignments.length : 'none');
    if (Array.isArray(yAssignments) && yAssignments.length > 0) {
      console.log('  assignments:', yAssignments.map(a => `${a.volunteerName} -> ${a.targetName} (${a.targetType})`));
    }
  }

  // Also check volunteers table for each event
  const { data: volunteers } = await supabase.from('volunteers').select('id, name, event_id, is_yuva, phone');
  console.log('\nTotal volunteers in db:', volunteers?.length);
  const byEv = {};
  volunteers?.forEach(v => {
    byEv[v.event_id] = (byEv[v.event_id] || 0) + 1;
    console.log(`Volunteer: "${v.name}" (${v.phone}) -> event_id: ${v.event_id}`);
  });
  console.log('Volunteers by event_id:', byEv);
}

checkYuvaAssignments();
