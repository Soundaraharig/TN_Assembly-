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

async function checkDetails() {
  const { data: event } = await supabase
    .from('college_events')
    .select('id, social_coverage')
    .eq('id', targetEventId)
    .single();

  const sc = event.social_coverage || {};
  const scores = sc.scores || [];
  const turns = sc.speaking_turns || [];

  console.log(`Total speaking turns in social_coverage: ${turns.length}`);

  // Inspect the 9 conflicting pairs
  const zhScores = scores.filter(s => (s.session_id || '').includes('zero'));
  console.log(`ZH Scores count: ${zhScores.length}`);

  zhScores.forEach(zh => {
    console.log(`\n========================================`);
    console.log(`Participant: ${zh.learner_name} (ID: ${zh.learner_id})`);
    console.log(`Jury: ${zh.juror_name} (ID: ${zh.jury_id})`);
    console.log(`ZH Score: ${zh.total} | Created: ${zh.created_at} | Updated: ${zh.updated_at}`);
    console.log(`ZH Full object keys & values:`);
    console.log(JSON.stringify(zh, null, 2));

    const qhMatches = scores.filter(s => 
      (s.session_id || '').includes('question') &&
      s.learner_id === zh.learner_id &&
      s.jury_id === zh.jury_id
    );

    qhMatches.forEach(qh => {
      console.log(`--- Matching QH Score ---`);
      console.log(`QH Score: ${qh.total} | Created: ${qh.created_at} | Updated: ${qh.updated_at}`);
      console.log(`QH Full object keys & values:`);
      console.log(JSON.stringify(qh, null, 2));
    });
  });
}

checkDetails().catch(console.error);
