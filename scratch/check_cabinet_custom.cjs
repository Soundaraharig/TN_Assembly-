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

async function check() {
  const { data, error } = await supabase.from('college_events').select('id, college_name, social_coverage');
  if (error) {
    console.error(error);
    return;
  }
  data.forEach(e => {
    console.log(e.college_name, '(', e.id, '):');
    console.log('  social_coverage.cabinet_ministries:', e.social_coverage?.cabinet_ministries);
  });

  const { data: learners } = await supabase.from('learners').select('full_name, role, event_id').neq('role', 'Member of Legislative Assembly (MLA)');
  console.log('\nNon-MLA learners:', learners?.length);
  learners?.forEach(l => {
    console.log(`[${l.event_id}] ${l.full_name}: "${l.role}"`);
  });
}

check();
