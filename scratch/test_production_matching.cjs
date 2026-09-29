const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeNameTokens(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function areNamesMatching(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Sorted tokens match (e.g. "K. Dhanush" and "Dhanush K")
  const sortedA = [...tokensA].sort().join(' ');
  const sortedB = [...tokensB].sort().join(' ');
  if (sortedA === sortedB) return true;

  // Single letter initial(s) stripped match
  const mainTokensA = tokensA.filter(t => t.length > 1);
  const mainTokensB = tokensB.filter(t => t.length > 1);
  if (mainTokensA.length > 0 && mainTokensB.length > 0) {
    if (mainTokensA.sort().join(' ') === mainTokensB.sort().join(' ')) {
      return true;
    }
  }

  return false;
}

function isLearnerQuestionMatch(learner, question, targetEventId) {
  if (!learner || !question) return { matches: false };

  // Event isolation: if both specify event_id, ensure they match
  const qEvId = question.event_id;
  const lEvId = learner.event_id || targetEventId;
  if (qEvId && lEvId && qEvId !== lEvId) {
    return { matches: false, reason: 'EVENT_MISMATCH' };
  }

  // 1. Direct ID matches
  const qStudentId = question.student_id;
  const qLearnerId = question.learner_id;
  const qDelegateId = question.delegate_id;
  const qMemberId = question.member_id;
  const qParticipantId = question.participant_id;
  const qUserId = question.user_id;

  if (qStudentId && learner.id && qStudentId === learner.id) return { matches: true, matchedBy: 'student_id' };
  if (qLearnerId && learner.id && qLearnerId === learner.id) return { matches: true, matchedBy: 'learner_id' };
  if (qDelegateId && learner.id && qDelegateId === learner.id) return { matches: true, matchedBy: 'delegate_id' };
  if (qMemberId && learner.id && qMemberId === learner.id) return { matches: true, matchedBy: 'member_id' };
  if (qParticipantId && learner.id && qParticipantId === learner.id) return { matches: true, matchedBy: 'participant_id' };
  if (qUserId && learner.id && qUserId === learner.id) return { matches: true, matchedBy: 'user_id' };

  // 2. Access code match
  const qAccessCode = question.access_code;
  if (qAccessCode && learner.access_code && qAccessCode.trim().toUpperCase() === learner.access_code.trim().toUpperCase()) {
    return { matches: true, matchedBy: 'access_code' };
  }

  // 3. Name match
  const qName = question.student_name || question.learner_name || question.delegate_name || question.member_name;
  const lName = learner.full_name || learner.name;
  if (qName && lName && areNamesMatching(qName, lName)) {
    return { matches: true, matchedBy: 'name' };
  }

  // 4. Constituency match + partial name match
  const qConstNum = question.constituency_number;
  const lConstNum = learner.constituency_number;
  if (qConstNum && lConstNum && Number(qConstNum) === Number(lConstNum) && qName && lName) {
    const qTokens = normalizeNameTokens(qName).filter(t => t.length > 2);
    const lTokens = normalizeNameTokens(lName).filter(t => t.length > 2);
    if (qTokens.some(t => lTokens.includes(t))) {
      return { matches: true, matchedBy: 'constituency_number_plus_name' };
    }
  }

  return { matches: false };
}

async function testProduction() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);
  const questions = event.social_coverage.proceedings_questions || [];

  console.log(`Loaded ${learners.length} learners and ${questions.length} questions.`);

  const submitterLearnerIds = new Set();
  const submittedRecords = [];

  learners.forEach(l => {
    const lQs = questions.filter(q => isLearnerQuestionMatch(l, q, eventId).matches);
    if (lQs.length > 0) {
      submitterLearnerIds.add(l.id);
      submittedRecords.push({ learner: l, questions: lQs });
      const firstMatch = isLearnerQuestionMatch(l, lQs[0], eventId);
      console.log(`[QUESTION-SUBMISSION-TRACE] eventId=${eventId} learnerId=${l.id} learnerName="${l.full_name}" questionId=${lQs[0].id} targetMinister="${lQs[0].ministry}" matchedBy=${firstMatch.matchedBy}`);
    }
  });

  console.log(`\n[QUESTION-SUBMISSION-STATUS] eventId=${eventId} totalLearners=${learners.length} totalQuestions=${questions.length} uniqueSubmittedLearnerIds=${submitterLearnerIds.size} submittedCount=${submittedRecords.length} notSubmittedCount=${learners.length - submittedRecords.length}`);

  // Specifically check K. Dhanush and Dharanish. K
  const dhanush = learners.find(l => l.full_name?.toLowerCase().includes('dhanush') && !l.full_name?.toLowerCase().includes('dhanushkasri'));
  const dharanish = learners.find(l => l.full_name?.toLowerCase().includes('dharanish'));

  console.log('\n--- TARGET CHECK ---');
  if (dharanish) {
    const qs = questions.filter(q => isLearnerQuestionMatch(dharanish, q, eventId).matches);
    console.log(`Dharanish. K (${dharanish.id}) submitted questions: ${qs.length}`);
  }
  if (dhanush) {
    const qs = questions.filter(q => isLearnerQuestionMatch(dhanush, q, eventId).matches);
    console.log(`K. Dhanush (${dhanush.id}) submitted questions: ${qs.length}`);
  }
}

testProduction().catch(console.error);
