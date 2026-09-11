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

async function checkAllEventsRoles() {
  const { data: events } = await supabase.from('college_events').select('id, college_name');
  for (const ev of events) {
    const { data: learners } = await supabase.from('learners').select('id, full_name, role').eq('event_id', ev.id);
    const cabinetLearners = learners?.filter(l => (l.role || '').includes('Minister for ') || (l.role || '').includes('Shadow Minister for '));
    console.log(`Event ${ev.college_name} (${ev.id}): ${cabinetLearners?.length || 0} cabinet/shadow ministers found.`);
  }
}

checkAllEventsRoles();
