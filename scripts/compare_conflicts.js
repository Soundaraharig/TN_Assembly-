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

async function compare() {
  const { data: event } = await supabase
    .from('college_events')
    .select('id, college_name, social_coverage')
    .eq('id', targetEventId)
    .single();

  const sc = event.social_coverage || {};
  const scores = sc.scores || [];
  const zhScores = scores.filter(s => (s.session_id || '').toLowerCase().includes('zero'));
  const qhScores = scores.filter(s => (s.session_id || '').toLowerCase().includes('question'));

  console.log('=== COMPREHENSIVE CONFLICT MATRIX ===\n');

  zhScores.forEach((zh, idx) => {
    const qh = qhScores.find(q => q.learner_id === zh.learner_id && q.jury_id === zh.jury_id);
    console.log(`[Record ${idx + 1}/10] Participant: ${zh.learner_name} | Juror: ${zh.juror_name}`);
    console.log(`  ZH Record ID: ${zh.id}`);
    console.log(`    Total: ${zh.total} (Res: ${zh.research_constituency}, Rel: ${zh.relevance_agenda}, Del: ${zh.communication_delivery}, Cond: ${zh.parliamentary_conduct}, Orig: ${zh.originality_preparation}, Time: ${zh.time_management})`);
    console.log(`    Turn ID: ${zh.speaking_turn_id || 'none'}`);
    console.log(`    Created: ${zh.created_at} | Updated: ${zh.updated_at}`);

    if (qh) {
      console.log(`  CONFLICTING QH Record ID: ${qh.id}`);
      console.log(`    Total: ${qh.total} (Res: ${qh.research_constituency}, Rel: ${qh.relevance_agenda}, Del: ${qh.communication_delivery}, Cond: ${qh.parliamentary_conduct}, Orig: ${qh.originality_preparation}, Time: ${qh.time_management})`);
      console.log(`    Turn ID: ${qh.speaking_turn_id || 'none'}`);
      console.log(`    Created: ${qh.created_at} | Updated: ${qh.updated_at}`);
      console.log(`    Status: ⚠️ CONFLICT - Participant already has a score from this juror in Question Hour!`);
    } else {
      console.log(`  Existing QH Record: NONE`);
      console.log(`    Status: ✅ CLEAN - Can be moved directly without conflict!`);
    }
    console.log('--------------------------------------------------');
  });
}

compare().catch(console.error);
