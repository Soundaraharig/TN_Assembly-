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

async function inspectAHS() {
  const eventId = '648790e1-0836-4a29-8a53-74929e7404f3';
  
  // 1. Check event record
  const { data: event } = await supabase.from('college_events').select('*').eq('id', eventId).single();
  console.log('Event details:', {
    id: event.id,
    college_name: event.college_name,
    participant_count: event.participant_count,
    social_coverage: event.social_coverage
  });

  // 2. Check elections
  const { data: elections } = await supabase.from('elections').select('*').eq('event_id', eventId);
  console.log('Elections count:', elections?.length);
  elections?.forEach(e => {
    console.log('Election:', {
      id: e.id,
      title: e.title,
      status: e.status,
      winner_id: e.winner_id,
      winner_name: e.winner_name,
      deputy_winner_id: e.deputy_winner_id,
      deputy_winner_name: e.deputy_winner_name
    });
  });

  // 3. Check learners roles
  const { data: learners } = await supabase.from('learners').select('id, full_name, role, bench, party_name').eq('event_id', eventId);
  console.log('Total learners:', learners?.length);
  const roles = {};
  learners?.forEach(l => {
    roles[l.role] = (roles[l.role] || 0) + 1;
  });
  console.log('Role breakdown:', roles);
}

inspectAHS();
