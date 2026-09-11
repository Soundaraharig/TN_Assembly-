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

async function cleanYuvaDatabase() {
  const ahsId = '648790e1-0836-4a29-8a53-74929e7404f3';
  const cnrId = '35f87a38-62de-4e0c-bffb-59c394f987b1';

  for (const evId of [ahsId, cnrId]) {
    const { data: ev, error: fetchErr } = await supabase
      .from('college_events')
      .select('id, college_name, social_coverage')
      .eq('id', evId)
      .single();

    if (fetchErr) {
      console.error(`Error fetching ${evId}:`, fetchErr);
      continue;
    }

    const sc = ev.social_coverage || {};
    console.log(`Before: ${ev.college_name} yuva_assignments:`, sc.yuva_assignments);

    const updatedSc = {
      ...sc,
      yuva_assignments: []
    };

    const { error: updateErr } = await supabase
      .from('college_events')
      .update({ social_coverage: updatedSc })
      .eq('id', evId);

    if (updateErr) {
      console.error(`Error updating ${ev.college_name}:`, updateErr);
    } else {
      console.log(`Cleaned yuva_assignments for ${ev.college_name} to []`);
    }
  }

  // Also tag JKKN ARTS and JKKNCET existing assignments with eventId so they are unambiguously scoped
  const artsId = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';
  const { data: artsEv } = await supabase.from('college_events').select('social_coverage').eq('id', artsId).single();
  if (artsEv && Array.isArray(artsEv.social_coverage?.yuva_assignments)) {
    const tagged = artsEv.social_coverage.yuva_assignments.map(a => ({ ...a, eventId: artsId }));
    await supabase.from('college_events').update({ social_coverage: { ...artsEv.social_coverage, yuva_assignments: tagged } }).eq('id', artsId);
    console.log('Tagged JKKN ARTS yuva_assignments with eventId:', artsId);
  }

  const cetId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: cetEv } = await supabase.from('college_events').select('social_coverage').eq('id', cetId).single();
  if (cetEv && Array.isArray(cetEv.social_coverage?.yuva_assignments)) {
    const tagged = cetEv.social_coverage.yuva_assignments.map(a => ({ ...a, eventId: cetId }));
    await supabase.from('college_events').update({ social_coverage: { ...cetEv.social_coverage, yuva_assignments: tagged } }).eq('id', cetId);
    console.log('Tagged JKKNCET yuva_assignments with eventId:', cetId);
  }

  console.log('Done cleaning YUVA assignments.');
}

cleanYuvaDatabase();
