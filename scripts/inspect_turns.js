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

async function checkTurns() {
  const { data: event } = await supabase
    .from('college_events')
    .select('id, social_coverage')
    .eq('id', targetEventId)
    .single();

  const sc = event.social_coverage || {};
  const turns = sc.speaking_turns || [];
  const scores = sc.scores || [];
  const zhScores = scores.filter(s => (s.session_id || '').includes('zero'));

  console.log(`--- Speaking Turns for ZH Scores ---`);
  zhScores.forEach(s => {
    const turn = turns.find(t => t.id === s.speaking_turn_id);
    console.log(`Score ID: ${s.id} | Participant: ${s.learner_name} | Turn ID: ${s.speaking_turn_id}`);
    if (turn) {
      console.log(`  Turn found: seq=${turn.sequence_number}, session_id=${turn.session_id}, session_name="${turn.session_name}", turn_type="${turn.turn_type || turn.speech_type}", called_by="${turn.called_by}"`);
    } else {
      console.log(`  Turn not found in speaking_turns`);
    }
  });

  // Check unique session_id and session_name across all speaking turns
  const sessionTurnCounts = {};
  turns.forEach(t => {
    const k = `${t.session_id} | ${t.session_name}`;
    sessionTurnCounts[k] = (sessionTurnCounts[k] || 0) + 1;
  });
  console.log(`\n--- Speaking Turns breakdown by session ---`);
  console.log(sessionTurnCounts);
}

checkTurns().catch(console.error);
