const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read environment
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl = '';
let supabaseAnonKey = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = trimmed.split('=')[1].trim();
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = trimmed.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalizeNameTokens(name) {
  if (!name) return [];
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function areNamesMatching(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;
  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  const initialsA = tokensA.filter(t => t.length === 1);
  const initialsB = tokensB.filter(t => t.length === 1);
  if (initialsA.length > 0 && initialsB.length > 0) {
    const hasOverlap = initialsA.some(init => initialsB.includes(init));
    if (!hasOverlap) return false;
  }
  const sortedA = [...tokensA].sort().join(' ');
  const sortedB = [...tokensB].sort().join(' ');
  if (sortedA === sortedB) return true;
  const mainTokensA = tokensA.filter(t => t.length > 1);
  const mainTokensB = tokensB.filter(t => t.length > 1);
  if (mainTokensA.length > 0 && mainTokensB.length > 0) {
    if (mainTokensA.sort().join(' ') === mainTokensB.sort().join(' ')) return true;
  }
  return false;
}

function isLearnerQuestionMatch(learner, question, targetEventId) {
  if (!learner || !question) return { matches: false };
  const qEvId = question.event_id;
  const lEvId = learner.event_id || targetEventId;
  if (qEvId && lEvId && qEvId !== lEvId) return { matches: false, reason: 'EVENT_MISMATCH' };

  const qStudentId = question.student_id;
  if (qStudentId && learner.id && qStudentId === learner.id) return { matches: true, matchedBy: 'student_id' };
  const qLearnerId = question.learner_id;
  if (qLearnerId && learner.id && qLearnerId === learner.id) return { matches: true, matchedBy: 'learner_id' };

  const qAccessCode = question.access_code;
  if (qAccessCode && learner.access_code && String(qAccessCode).trim().toUpperCase() === String(learner.access_code).trim().toUpperCase()) {
    return { matches: true, matchedBy: 'access_code' };
  }

  const qName = question.student_name || question.learner_name;
  const lName = learner.full_name || learner.name;
  const rawQConst = question.constituency_number !== undefined && question.constituency_number !== null ? question.constituency_number : question.constituency_no;
  const qConstNum = rawQConst !== undefined && rawQConst !== null && !isNaN(Number(rawQConst)) ? Number(rawQConst) : undefined;
  const lConstNum = learner.constituency_number !== undefined && learner.constituency_number !== null && !isNaN(Number(learner.constituency_number)) ? Number(learner.constituency_number) : undefined;

  const hasConstNumMatch = qConstNum !== undefined && lConstNum !== undefined && qConstNum > 0 && qConstNum === lConstNum;

  if (hasConstNumMatch && (qEvId === lEvId || targetEventId)) {
    if (!qName || areNamesMatching(qName, lName)) {
      return { matches: true, matchedBy: 'constituency_and_name' };
    }
  }

  if (hasConstNumMatch && qName && lName) {
    if (areNamesMatching(qName, lName)) return { matches: true, matchedBy: 'constituency_and_name' };
    const qTokens = normalizeNameTokens(qName).filter(t => t.length > 2);
    const lTokens = normalizeNameTokens(lName).filter(t => t.length > 2);
    if (qTokens.length > 0 && lTokens.length > 0 && qTokens.some(t => lTokens.includes(t))) {
      return { matches: true, matchedBy: 'constituency_and_name' };
    }
  }

  if (qName && lName) {
    if (qName.trim().toLowerCase() === lName.trim().toLowerCase()) return { matches: true, matchedBy: 'exact_name' };
    if (areNamesMatching(qName, lName)) return { matches: true, matchedBy: 'normalized_name' };
  }

  return { matches: false };
}

async function runAudit() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824'; // JKKNCET
  console.log('=== VERIFYING PRODUCTION DATABASE FOR EVENT ' + eventId + ' ===');

  const { data: eventData, error: evErr } = await supabase
    .from('college_events')
    .select('id, college_name, social_coverage')
    .eq('id', eventId)
    .single();

  if (evErr) throw evErr;

  const { data: learners, error: lErr } = await supabase
    .from('learners')
    .select('*')
    .eq('event_id', eventId);

  if (lErr) throw lErr;

  const sc = eventData.social_coverage || {};
  const proceedingsQuestions = Array.isArray(sc.proceedings_questions) ? sc.proceedings_questions : [];

  console.log('Total learners in DB:', learners.length);
  console.log('Total proceedings_questions in DB:', proceedingsQuestions.length);

  // K. Dhanush resolution
  const kDhanushLearner = learners.find(l => areNamesMatching(l.full_name, 'K. Dhanush') || l.constituency_number === 120);
  console.log('\n[LEARNER-IDENTITY-TRACE]', {
    learnerId: kDhanushLearner?.id,
    full_name: kDhanushLearner?.full_name,
    access_code: kDhanushLearner?.access_code,
    constituency: kDhanushLearner?.constituency_name,
    constituency_number: kDhanushLearner?.constituency_number,
    party: kDhanushLearner?.party_name,
    bench: kDhanushLearner?.bench,
    eventId: eventId
  });

  // Exhaustive search for K. Dhanush in questions
  const matchingQs = proceedingsQuestions.filter(q => isLearnerQuestionMatch(kDhanushLearner, q, eventId).matches);
  console.log('\n[QUESTION-DB-TRACE]', {
    eventId,
    targetMember: 'K. Dhanush',
    matchFound: matchingQs.length > 0,
    count: matchingQs.length,
    message: matchingQs.length === 0 ? 'K. Dhanush submission is not currently persisted in authoritative DB.' : 'Found in DB'
  });

  // Regression students
  const testNames = [
    'K. Dhanush',
    'Dharanish. K',
    'Gopi. P',
    'Rohit. V',
    'Veenaikasri. AI',
    'Vishnupriya. S'
  ];

  console.log('\n=== REGRESSION STUDENT IDENTITY & SUBMISSION MATRIX ===');
  for (const name of testNames) {
    const l = learners.find(lrn => areNamesMatching(lrn.full_name, name));
    if (!l) {
      console.log(`Learner "${name}": NOT FOUND in learners`);
      continue;
    }
    const qMatches = proceedingsQuestions.filter(q => isLearnerQuestionMatch(l, q, eventId).matches);
    console.log(`Learner "${l.full_name}" (Const ${l.constituency_number} - ${l.constituency_name}, ${l.bench}):`);
    console.log(`  -> Submitted Questions Count: ${qMatches.length}`);
    console.log(`  -> Classification: ${qMatches.length > 0 ? 'SUBMITTED' : 'NOT SUBMITTED'}`);
    if (qMatches.length > 0) {
      const q = qMatches[0];
      const matchRes = isLearnerQuestionMatch(l, q, eventId);
      console.log(`  -> Matched By: ${matchRes.matchedBy}, Ministry: ${q.ministry}, Status: ${q.status}`);
    }
  }

  // Verify K. Dhanush vs Dharanish. K distinction
  const dharanishLearner = learners.find(l => areNamesMatching(l.full_name, 'Dharanish. K'));
  const dhanushLearner = learners.find(l => areNamesMatching(l.full_name, 'K. Dhanush'));
  console.log('\n=== DISTINCTNESS VERIFICATION ===');
  console.log('K. Dhanush ID:', dhanushLearner?.id, 'Const:', dhanushLearner?.constituency_number);
  console.log('Dharanish. K ID:', dharanishLearner?.id, 'Const:', dharanishLearner?.constituency_number);
  console.log('Are names matching between K. Dhanush and Dharanish. K?:', areNamesMatching('K. Dhanush', 'Dharanish. K'));
  const dharanishQ = proceedingsQuestions.find(q => q.id === 'q-1741517400039' || (q.student_name && q.student_name.includes('Dharanish')));
  if (dharanishQ) {
    console.log('Dharanish Q matched to Dharanish. K?:', isLearnerQuestionMatch(dharanishLearner, dharanishQ, eventId).matches);
    console.log('Dharanish Q falsely matched to K. Dhanush?:', isLearnerQuestionMatch(dhanushLearner, dharanishQ, eventId).matches);
  }

  // Ministry filter independence test
  console.log('\n=== MINISTRY FILTER INDEPENDENCE TEST ===');
  const mockStudent = { id: 'test-123', full_name: 'Test Student', constituency_number: 10, bench: 'Opposition' };
  const mockEduQuestion = { id: 'q-edu-1', student_id: 'test-123', student_name: 'Test Student', ministry: 'Ministry of Education', event_id: eventId };
  const mockQuestions = [mockEduQuestion];

  function calculateStatus(eligibleLearners, validQs, currentMinistryFilter) {
    const sub = [];
    const notSub = [];
    eligibleLearners.forEach(learner => {
      const allQs = validQs.filter(q => isLearnerQuestionMatch(learner, q, eventId).matches);
      if (allQs.length > 0) {
        let relevantQs = allQs;
        if (currentMinistryFilter !== 'All') {
          const match = allQs.filter(q => q.ministry === currentMinistryFilter);
          if (match.length > 0) relevantQs = match;
        }
        sub.push({ learner, questions: relevantQs });
      } else {
        notSub.push(learner);
      }
    });
    return { sub, notSub };
  }

  const allRes = calculateStatus([mockStudent], mockQuestions, 'All');
  const eduRes = calculateStatus([mockStudent], mockQuestions, 'Ministry of Education');
  const finRes = calculateStatus([mockStudent], mockQuestions, 'Ministry of Finance');

  console.log('Filter = All -> Submitted:', allRes.sub.length, 'Not Submitted:', allRes.notSub.length);
  console.log('Filter = Ministry of Education -> Submitted:', eduRes.sub.length, 'Not Submitted:', eduRes.notSub.length);
  console.log('Filter = Ministry of Finance -> Submitted:', finRes.sub.length, 'Not Submitted:', finRes.notSub.length);
  console.log('Test PASSED if Submitted is 1 in all three cases: ', allRes.sub.length === 1 && eduRes.sub.length === 1 && finRes.sub.length === 1);
}

runAudit().catch(console.error);
