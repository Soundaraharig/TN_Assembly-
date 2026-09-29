const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function phase1() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  console.log('====================================================');
  console.log('PHASE 1 & 2: SOURCE-OF-TRUTH INVESTIGATION');
  console.log('====================================================');

  // 1. Fetch ALL learner records in JKKNCET
  const { data: learners, error: lErr } = await supabase.from('learners').select('*').eq('event_id', eventId);
  if (lErr) {
    console.error('Error fetching learners:', lErr);
    return;
  }
  console.log(`Total learners in JKKNCET: ${learners.length}`);

  // Find all learner records matching Dhanush or 120 or Aravakurichi or RFNQNU
  const dhanushLearners = learners.filter(l => {
    const s = JSON.stringify(l).toLowerCase();
    return s.includes('dhanush') || s.includes('120') || s.includes('aravakurichi') || s.includes('rfnqnu');
  });
  console.log(`Matching learners found: ${dhanushLearners.length}`);
  dhanushLearners.forEach(l => {
    console.log('[LEARNER-IDENTITY-TRACE]');
    console.log(`learnerId=${l.id}`);
    console.log(`full_name="${l.full_name}"`);
    console.log(`access_code=${l.access_code}`);
    console.log(`constituency="${l.constituency_name}"`);
    console.log(`constituency_number=${l.constituency_number}`);
    console.log(`party="${l.party_name}" (id: ${l.party_id})`);
    console.log(`bench=${l.bench}`);
    console.log(`eventId=${l.event_id}`);
    console.log(`role="${l.role}"`);
    console.log(`all available identity aliases: id=${l.id}, access_code=${l.access_code}, number=${l.constituency_number}, name=${l.full_name}\n`);
  });

  // 2. Fetch JKKNCET event social_coverage
  const { data: ev, error: evErr } = await supabase.from('college_events').select('*').eq('id', eventId).single();
  if (evErr) {
    console.error('Error fetching event:', evErr);
    return;
  }

  const sc = ev.social_coverage || {};
  console.log('Keys in JKKNCET social_coverage:', Object.keys(sc));
  const questions = sc.proceedings_questions || [];
  console.log(`Total proceedings_questions in JKKNCET social_coverage: ${questions.length}`);

  // Check deleted questions if any
  const deletedQIds = sc.deleted_question_ids || sc.deleted_questions || [];
  console.log(`Deleted question IDs in social_coverage:`, deletedQIds);

  // Search questions in JKKNCET for ANY match to Dhanush, Aravakurichi, 120, RFNQNU, or learner ID
  const dhanushId = dhanushLearners[0]?.id;
  const dhanushCode = dhanushLearners[0]?.access_code;

  console.log('\nSearching JKKNCET questions for matches...');
  let matchingQuestions = [];
  questions.forEach((q, idx) => {
    const qStr = JSON.stringify(q).toLowerCase();
    const isMatch = (
      (q.student_id && (q.student_id === dhanushId || dhanushLearners.some(dl => dl.id === q.student_id))) ||
      (q.learner_id && (q.learner_id === dhanushId || dhanushLearners.some(dl => dl.id === q.learner_id))) ||
      (q.access_code && (q.access_code === dhanushCode || dhanushLearners.some(dl => dl.access_code === q.access_code))) ||
      (q.constituency_number && (q.constituency_number == 120)) ||
      (q.constituency && q.constituency.toLowerCase().includes('aravakurichi')) ||
      (q.constituency_name && q.constituency_name.toLowerCase().includes('aravakurichi')) ||
      (q.student_name && q.student_name.toLowerCase().includes('dhanush')) ||
      qStr.includes('dhanush') ||
      qStr.includes('aravakurichi') ||
      qStr.includes('120') ||
      (dhanushId && qStr.includes(dhanushId.toLowerCase()))
    );

    if (isMatch) {
      matchingQuestions.push({ q, idx });
    }
  });

  console.log(`Matching questions found in JKKNCET: ${matchingQuestions.length}`);
  matchingQuestions.forEach(({ q, idx }) => {
    console.log('[QUESTION-DB-TRACE]');
    console.log(`eventId=${q.event_id || eventId}`);
    console.log(`questionId=${q.id} (index: ${idx})`);
    console.log(`student_id=${q.student_id}`);
    console.log(`learner_id=${q.learner_id}`);
    console.log(`delegate_id=${q.delegate_id}`);
    console.log(`member_id=${q.member_id}`);
    console.log(`participant_id=${q.participant_id}`);
    console.log(`user_id=${q.user_id}`);
    console.log(`access_code=${q.access_code}`);
    console.log(`student_name="${q.student_name}"`);
    console.log(`target ministry="${q.ministry || q.target || q.target_name || q.target_ministry_name}"`);
    console.log(`question type=${q.question_type}`);
    console.log(`question status=${q.status}`);
    console.log(`deleted flag if any=${q.deleted || false}`);
    console.log(`submitted_at=${q.created_at}`);
    console.log(`approved_at=${q.approved_at}`);
    console.log(`created_at=${q.created_at}`);
    console.log(`updated_at=${q.updated_at}`);
    console.log(`constituency="${q.constituency || q.constituency_name}"`);
    console.log(`constituency_number=${q.constituency_number}`);
    console.log(`bench=${q.bench}`);
    console.log(`party=${q.party}`);
    console.log(`full question text length=${(q.question_text || '').length}\n`);
    console.log(`Question text: "${q.question_text}"\n`);
  });

  // 3. Search ALL events in college_events
  console.log('\nSearching ALL other college_events for Dhanush / Aravakurichi / RFNQNU / 120...');
  const { data: allEvents } = await supabase.from('college_events').select('id, college_name, slug, social_coverage');
  allEvents.forEach(e => {
    if (e.id === eventId) return;
    const eQs = e.social_coverage?.proceedings_questions || [];
    eQs.forEach((q, idx) => {
      const qStr = JSON.stringify(q).toLowerCase();
      if (qStr.includes('dhanush') || qStr.includes('aravakurichi') || (dhanushId && qStr.includes(dhanushId.toLowerCase()))) {
        console.log(`Found match in other event "${e.college_name}" (${e.id}) Q#${idx}:`, q.id, q.student_name, q.constituency);
      }
    });
  });

  // 4. Search login_records, audit_logs, speaking_requests in Supabase for Dhanush
  console.log('\nChecking login_records for Dhanush...');
  try {
    const { data: logins } = await supabase.from('login_records').select('*').limit(200);
    if (logins) {
      const dhanushLogins = logins.filter(l => JSON.stringify(l).toLowerCase().includes('dhanush') || (dhanushId && JSON.stringify(l).includes(dhanushId)));
      console.log(`Dhanush login records found: ${dhanushLogins.length}`);
      dhanushLogins.forEach(dl => console.log('Login:', dl));
    }
  } catch (e) {
    console.log('Login records query failed:', e.message);
  }
}

phase1().catch(console.error);
