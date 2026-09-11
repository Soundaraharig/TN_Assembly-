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

async function fixAhsEvent() {
  const eventId = '648790e1-0836-4a29-8a53-74929e7404f3';

  // 1. Get all learners for this event
  const { data: learners, error: fetchErr } = await supabase
    .from('learners')
    .select('id, full_name, role, bench, party_name')
    .eq('event_id', eventId);

  if (fetchErr) {
    console.error('Error fetching learners:', fetchErr);
    return;
  }

  console.log(`Fetched ${learners.length} learners for JKKN AHS.`);

  const toReset = learners.filter(l => {
    const r = l.role || '';
    return (
      r.startsWith('Minister for ') ||
      r.startsWith('Shadow Minister for ') ||
      r.includes('Chief Minister') ||
      r.includes('Leader of the Opposition') ||
      r.includes('Deputy Leader of Opposition') ||
      r === 'Speaker of Legislative Assembly' ||
      r === 'Deputy Speaker'
    );
  });

  console.log(`Found ${toReset.length} learners with auto-assigned senior/cabinet roles to reset.`);

  if (toReset.length > 0) {
    const ids = toReset.map(l => l.id);
    const { error: updateErr } = await supabase
      .from('learners')
      .update({ role: 'Member of Legislative Assembly (MLA)' })
      .in('id', ids);

    if (updateErr) {
      console.error('Error updating learners:', updateErr);
      return;
    }
    console.log(`Successfully reset ${toReset.length} learners to "Member of Legislative Assembly (MLA)".`);
  }

  // 2. Update participant_count in college_events
  const { error: evErr } = await supabase
    .from('college_events')
    .update({ participant_count: learners.length })
    .eq('id', eventId);

  if (evErr) {
    console.error('Error updating event participant_count:', evErr);
  } else {
    console.log(`Updated JKKN AHS participant_count to ${learners.length}.`);
  }

  // 3. Verify
  const { data: updatedLearners } = await supabase
    .from('learners')
    .select('id, full_name, role')
    .eq('event_id', eventId);

  const nonMla = updatedLearners.filter(l => l.role !== 'Member of Legislative Assembly (MLA)' && l.role !== 'MLA');
  console.log('Remaining non-MLA roles count in JKKN AHS:', nonMla.length);
  if (nonMla.length > 0) {
    console.log('Remaining roles:', nonMla);
  } else {
    console.log('All 72 learners are now cleanly set to Member of Legislative Assembly (MLA).');
  }
}

fixAhsEvent();
