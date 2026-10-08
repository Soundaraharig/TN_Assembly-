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

async function execute() {
  console.log('=== STEP 4: SAFELY APPLY SCORE REASSIGNMENT ===\n');

  // 1. Fetch current authoritative state
  const { data: event, error: fetchErr } = await supabase
    .from('college_events')
    .select('id, college_name, social_coverage')
    .eq('id', targetEventId)
    .single();

  if (fetchErr || !event) {
    console.error('Failed to fetch event:', fetchErr);
    process.exit(1);
  }

  const sc = event.social_coverage || {};
  const scores = sc.scores || [];

  console.log(`Fetched event: "${event.college_name}"`);
  console.log(`Total existing scores: ${scores.length}`);

  // 2. Create emergency backup to disk
  if (!fs.existsSync('scratch')) {
    fs.mkdirSync('scratch');
  }
  const backupPath = `scratch/backup_scores_${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(scores, null, 2));
  console.log(`✅ Pre-update scores backup saved to: ${backupPath}`);

  // 3. Define target reassignment mapping
  const zhRecords = scores.filter(s => (s.session_id || '').toLowerCase().includes('zero'));
  console.log(`Zero Hour records found: ${zhRecords.length}`);

  if (zhRecords.length !== 10) {
    console.warn(`WARNING: Expected 10 Zero Hour records, found ${zhRecords.length}`);
  }

  const targetMapping = {
    // Record 10: Dhanushkasri -> Question Hour
    'eval_1791450650807_wzlvub5': { sessionId: 'question_hour', sessionName: 'Question Hour' },

    // Records 1-9: 9 members already in Question Hour -> 90 Sec Speech
    'eval_1791438043388_bz928ya': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // Vishnupriya. S (SANTHIYA K)
    'eval_1791438040011_7nlrsdn': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // Vishnupriya. S (NARMADHA S)
    'eval_1791438787184_m654t24': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // K. Dhanush (Gokulapriya S)
    'eval_1791438928688_5r24gc3': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // Rohith. M (SANTHIYA K)
    'eval_1791439329963_se7efy5': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // K. Dhanush (SANTHIYA K)
    'eval_1791439385781_uhp4c1s': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // Kavipriya. K (SANTHIYA K)
    'eval_1791439579594_eqmchyt': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // BOOMESH.M (SANTHIYA K)
    'eval_1791439622552_uaca010': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }, // N.Venkatapreethi (SANTHIYA K)
    'eval_1791439660866_mx6m7gc': { sessionId: '90_sec_speech', sessionName: '90 Sec Speech' }  // Rubasri. VS (SANTHIYA K)
  };

  let movedCount = 0;
  const updatedScores = scores.map(s => {
    if (targetMapping[s.id]) {
      movedCount++;
      const target = targetMapping[s.id];
      console.log(`Reassigning [${s.id}] (${s.learner_name} / ${s.juror_name}): "${s.session_name}" ==> "${target.sessionName}"`);
      return {
        ...s,
        session_id: target.sessionId,
        session_name: target.sessionName
      };
    }
    return s;
  });

  console.log(`\nRecords modified: ${movedCount}`);
  if (movedCount !== 10) {
    console.error(`ERROR: Expected to modify 10 records, but matched ${movedCount}. Aborting.`);
    process.exit(1);
  }

  // 4. Update Supabase social_coverage.scores
  const updatedSocialCoverage = {
    ...sc,
    scores: updatedScores,
    updated_at: new Date().toISOString()
  };

  const { error: updateErr } = await supabase
    .from('college_events')
    .update({ social_coverage: updatedSocialCoverage })
    .eq('id', targetEventId);

  if (updateErr) {
    console.error('Failed to update college_events:', updateErr);
    process.exit(1);
  }

  console.log('\n✅ Successfully updated college_events in Supabase!');

  // 5. Verification re-fetch
  console.log('\n=== STEP 6: POST-UPDATE VERIFICATION ===');
  const { data: verifyEvent, error: verifyErr } = await supabase
    .from('college_events')
    .select('id, social_coverage')
    .eq('id', targetEventId)
    .single();

  if (verifyErr || !verifyEvent) {
    console.error('Verification query failed:', verifyErr);
    process.exit(1);
  }

  const vScores = verifyEvent.social_coverage?.scores || [];
  const vZh = vScores.filter(s => (s.session_id || '').toLowerCase().includes('zero'));
  const vQh = vScores.filter(s => (s.session_id || '').toLowerCase().includes('question'));
  const vSpeech = vScores.filter(s => (s.session_id || '').toLowerCase().includes('90'));

  console.log(`Total scores in database: ${vScores.length} (Expected: 236)`);
  console.log(`Zero Hour scores remaining: ${vZh.length} (Expected: 0)`);
  console.log(`Question Hour scores count: ${vQh.length} (Expected: 139)`);
  console.log(`90 Sec Speech scores count: ${vSpeech.length} (Expected: 97)`);

  const vSum = vScores.reduce((sum, s) => sum + Number(s.total || 0), 0);
  console.log(`Total score sum: ${vSum} (Expected: 14529)`);

  if (vScores.length === 236 && vZh.length === 0 && vQh.length === 139 && vSpeech.length === 97 && vSum === 14529) {
    console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
  } else {
    console.warn('\n⚠️ Verification discrepancy detected!');
  }
}

execute().catch(console.error);
