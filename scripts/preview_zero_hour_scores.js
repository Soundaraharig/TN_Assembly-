import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const targetEventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function preview() {
  console.log('=== STEP 1 & 2: DETAILED DIAGNOSTIC PREVIEW ===\n');

  const { data: event, error: eventErr } = await supabase
    .from('college_events')
    .select('id, college_name, social_coverage')
    .eq('id', targetEventId)
    .single();

  if (eventErr || !event) {
    console.error('Failed to load event:', eventErr);
    return;
  }

  const sc = event.social_coverage || {};
  const allScores = Array.isArray(sc.scores) ? sc.scores : [];

  console.log(`Event ID: ${event.id}`);
  console.log(`Event Name: ${event.college_name}`);
  console.log(`Total Score Records in social_coverage: ${allScores.length}\n`);

  // Filter Zero Hour scores
  const zeroHourScores = allScores.filter(s => {
    const sId = (s.session_id || '').toLowerCase();
    const sName = (s.session_name || '').toLowerCase();
    return sId.includes('zero') || sName.includes('zero');
  });

  // Filter Question Hour scores
  const questionHourScores = allScores.filter(s => {
    const sId = (s.session_id || '').toLowerCase();
    const sName = (s.session_name || '').toLowerCase();
    return (sId.includes('question') || sName.includes('question')) && !sId.includes('zero');
  });

  console.log(`--- ZERO HOUR SCORES FOUND: ${zeroHourScores.length} ---`);
  
  const affectedParticipants = new Set();
  const affectedJuries = new Set();
  let totalScoreSum = 0;

  zeroHourScores.forEach((s, idx) => {
    affectedParticipants.add(s.learner_id || s.participant_id);
    affectedJuries.add(s.jury_id || s.juror_name);
    totalScoreSum += Number(s.total || 0);

    console.log(`\nRecord #${idx + 1}:`);
    console.log(`  ID: ${s.id}`);
    console.log(`  Participant ID: ${s.learner_id || s.participant_id}`);
    console.log(`  Participant Name: ${s.learner_name || s.student_name}`);
    console.log(`  Jury ID: ${s.jury_id}`);
    console.log(`  Jury Name: ${s.juror_name || s.jury_name}`);
    console.log(`  Session ID: ${s.session_id}`);
    console.log(`  Session Name: ${s.session_name}`);
    console.log(`  Scores: Research=${s.research_constituency}, Relevance=${s.relevance_agenda}, Delivery=${s.communication_delivery}, Conduct=${s.parliamentary_conduct}, Originality=${s.originality_preparation}, Time=${s.time_management}`);
    console.log(`  Total Score: ${s.total}`);
    console.log(`  Feedback: "${s.feedback || ''}"`);
    console.log(`  Created At: ${s.created_at}`);
    console.log(`  Updated At: ${s.updated_at}`);
  });

  console.log('\n--- ZERO HOUR SUMMARY METRICS ---');
  console.log(`Total records to move: ${zeroHourScores.length}`);
  console.log(`Total affected participants: ${affectedParticipants.size}`);
  console.log(`Total affected juries: ${affectedJuries.size}`);
  console.log(`Total score sum: ${totalScoreSum}`);

  console.log(`\n--- EXISTING QUESTION HOUR SCORES: ${questionHourScores.length} ---`);
  // Check for potential duplicate conflicts if moved to question_hour
  // Uniqueness key: (event_id, session_id, jury_id, learner_id)
  console.log('\n--- DUPLICATE CONFLICT CHECK ---');
  let conflictCount = 0;
  const conflicts = [];

  zeroHourScores.forEach(zh => {
    const zhLearner = zh.learner_id || zh.participant_id;
    const zhJury = zh.jury_id || zh.juror_name;

    const matchingQh = questionHourScores.filter(qh => {
      const qhLearner = qh.learner_id || qh.participant_id;
      const qhJury = qh.jury_id || qh.juror_name;
      return zhLearner === qhLearner && zhJury === qhJury;
    });

    if (matchingQh.length > 0) {
      conflictCount++;
      conflicts.push({
        zeroHourRecord: zh,
        existingQuestionHourRecords: matchingQh
      });
      console.log(`⚠️ POTENTIAL CONFLICT for Participant: "${zh.learner_name || zhLearner}" and Jury: "${zh.juror_name || zhJury}"`);
      console.log(`   Zero Hour Record ID: ${zh.id} (Score: ${zh.total})`);
      matchingQh.forEach(m => {
        console.log(`   Existing Question Hour Record ID: ${m.id} (Score: ${m.total}, Session: "${m.session_id} | ${m.session_name}")`);
      });
    }
  });

  if (conflictCount === 0) {
    console.log('✅ ZERO CONFLICTS DETECTED! No participant has existing Question Hour scores from the same jury.');
  } else {
    console.log(`⚠️ ${conflictCount} CONFLICT(S) FOUND!`);
  }
}

preview().catch(console.error);
