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

async function cleanArtsCabinet() {
  const eventId = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';

  // 1. Update roles in learners table
  const roleUpdates = [
    { name: 'Bharani.S', role: 'Minister for Public Works & Infrastructure' },
    { name: 'Makeskumar. v', role: 'Shadow Minister for Public Works & Infrastructure' },
    { name: 'N. Nathiya', role: 'Minister for IT & AI' },
    { name: 'Mohammad Faizul', role: 'Shadow Minister for IT & AI' }
  ];

  for (const u of roleUpdates) {
    const { error } = await supabase
      .from('learners')
      .update({ role: u.role })
      .eq('event_id', eventId)
      .ilike('full_name', u.name);

    if (error) {
      console.error(`Error updating ${u.name}:`, error);
    } else {
      console.log(`Updated ${u.name} role to "${u.role}"`);
    }
  }

  // 2. Update social_coverage.cabinet_ministries
  const { data: ev } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  if (ev) {
    const updatedMinistries = [
      'Ministry of Education',
      'Ministry of Finance',
      'Ministry of Health & Family Welfare',
      'Ministry of IT & AI',
      'Ministry of Public Works & Infrastructure',
      'Ministry of Youth Affairs & Sports'
    ];
    const updatedSc = {
      ...(ev.social_coverage || {}),
      cabinet_ministries: updatedMinistries
    };
    await supabase.from('college_events').update({ social_coverage: updatedSc }).eq('id', eventId);
    console.log('Updated JKKN ARTS cabinet_ministries to canonical list:', updatedMinistries);
  }
}

cleanArtsCabinet();
