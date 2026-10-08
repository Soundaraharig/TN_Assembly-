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

async function check90Sec() {
  const { data: event } = await supabase
    .from('college_events')
    .select('id, social_coverage')
    .eq('id', targetEventId)
    .single();

  const sc = event.social_coverage || {};
  const scores = sc.scores || [];
  const zhScores = scores.filter(s => (s.session_id || '').toLowerCase().includes('zero'));
  const speechScores = scores.filter(s => (s.session_id || '').toLowerCase().includes('90'));

  console.log(`Total 90 Sec Speech scores: ${speechScores.length}`);

  zhScores.forEach(zh => {
    const speechMatch = speechScores.filter(s => s.learner_id === zh.learner_id && s.jury_id === zh.jury_id);
    console.log(`Participant: ${zh.learner_name} | Juror: ${zh.juror_name}`);
    console.log(`  ZH Record ID: ${zh.id} (Score: ${zh.total}, Turn: ${zh.speaking_turn_id})`);
    if (speechMatch.length > 0) {
      speechMatch.forEach(m => {
        console.log(`  Has existing 90 Sec Speech score: ID=${m.id}, Score=${m.total}, Turn=${m.speaking_turn_id}`);
      });
    } else {
      console.log(`  NO 90 Sec Speech score from this juror!`);
    }
  });
}

check90Sec().catch(console.error);
