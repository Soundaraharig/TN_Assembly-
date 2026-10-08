import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const targetEventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function simulate() {
  const { data: event, error: eventErr } = await supabase
    .from('college_events')
    .select('id, college_name, social_coverage')
    .eq('id', targetEventId)
    .single();

  if (eventErr || !event) {
    console.error('Error fetching event:', eventErr);
    return;
  }

  const sc = event.social_coverage || {};
  const scores = sc.scores || [];

  console.log(`Original total scores: ${scores.length}`);

  const zhScores = scores.filter(s => (s.session_id || '').toLowerCase().includes('zero'));
  console.log(`Zero Hour scores to reassign: ${zhScores.length}`);

  // Reassignment plan:
  // - If participant ALREADY has a Question Hour evaluation from this juror -> reassign to 90_sec_speech ("90 Sec Speech")
  // - If participant does NOT have a Question Hour evaluation -> reassign to question_hour ("Question Hour")
  const qhScores = scores.filter(s => (s.session_id || '').toLowerCase().includes('question'));

  const reassignments = zhScores.map(s => {
    const hasQh = qhScores.some(q => q.learner_id === s.learner_id && q.jury_id === s.jury_id);
    const targetSessionId = hasQh ? '90_sec_speech' : 'question_hour';
    const targetSessionName = hasQh ? '90 Sec Speech' : 'Question Hour';
    return {
      id: s.id,
      learner_name: s.learner_name,
      juror_name: s.juror_name,
      old_session: `${s.session_id} | ${s.session_name}`,
      new_session: `${targetSessionId} | ${targetSessionName}`,
      targetSessionId,
      targetSessionName,
      total: s.total
    };
  });

  console.log('\n--- Planned Reassignments ---');
  reassignments.forEach((r, i) => {
    console.log(`[${i + 1}/10] ${r.learner_name} (${r.juror_name}) -> Score ${r.total}: "${r.old_session}" ==> "${r.new_session}"`);
  });

  // Simulate updating the scores array
  const updatedScores = scores.map(s => {
    const plan = reassignments.find(r => r.id === s.id);
    if (plan) {
      return {
        ...s,
        session_id: plan.targetSessionId,
        session_name: plan.targetSessionName
      };
    }
    return s;
  });

  console.log(`\nSimulated total scores: ${updatedScores.length}`);
  const simZh = updatedScores.filter(s => (s.session_id || '').toLowerCase().includes('zero'));
  const simQh = updatedScores.filter(s => (s.session_id || '').toLowerCase().includes('question'));
  const simSpeech = updatedScores.filter(s => (s.session_id || '').toLowerCase().includes('90'));

  console.log(`Zero Hour scores after update: ${simZh.length}`);
  console.log(`Question Hour scores after update: ${simQh.length}`);
  console.log(`90 Sec Speech scores after update: ${simSpeech.length}`);

  // Verify total score sum
  const origSum = scores.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const updatedSum = updatedScores.reduce((sum, s) => sum + Number(s.total || 0), 0);
  console.log(`\nOriginal score sum across entire event: ${origSum}`);
  console.log(`Updated score sum across entire event: ${updatedSum}`);
  console.log(`Score sum matched: ${origSum === updatedSum ? 'YES ✅' : 'NO ❌'}`);
}

simulate().catch(console.error);
