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

  const dhanushScores = scores.filter(s => s.learner_name && s.learner_name.includes('Dhanush') && s.jury_id === 'af112c5d-62ad-4855-9e58-7492191be4fb');
  console.log('K. Dhanush scores by SANTHIYA K:');
  dhanushScores.forEach(s => {
    console.log(`  ID: ${s.id}, Session: "${s.session_id} | ${s.session_name}", Total: ${s.total}, Turn: ${s.speaking_turn_id}, Created: ${s.created_at}`);
  });

  const boomeshScores = scores.filter(s => s.learner_name && s.learner_name.includes('BOOMESH') && s.jury_id === 'af112c5d-62ad-4855-9e58-7492191be4fb');
  console.log('\nBOOMESH.M scores by SANTHIYA K:');
  boomeshScores.forEach(s => {
    console.log(`  ID: ${s.id}, Session: "${s.session_id} | ${s.session_name}", Total: ${s.total}, Turn: ${s.speaking_turn_id}, Created: ${s.created_at}`);
  });
}

checkDetails().catch(console.error);
