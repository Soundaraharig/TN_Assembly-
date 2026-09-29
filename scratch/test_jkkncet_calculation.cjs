const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalculation() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage, slug').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);

  const questions = event.social_coverage?.proceedings_questions || [];

  console.log(`Loaded ${learners.length} learners and ${questions.length} questions.`);

  // Current ProceedingsTab isLearnerQuestion implementation:
  const currentIsLearnerQuestion = (l, q) => {
    if (q.student_id && l.id && q.student_id === l.id) return true;
    if (q.student_name && l.full_name && q.student_name.trim().toLowerCase() === l.full_name.trim().toLowerCase()) return true;
    return false;
  };

  // Run calculation with benchFilter = 'All', ministryFilter = 'All'
  console.log('\n--- EVALUATING WITH benchFilter = "All", ministryFilter = "All" ---');
  let submittedCount = 0;
  let notSubmittedCount = 0;
  const submittedLearners = [];
  const notSubmittedLearners = [];

  learners.forEach(l => {
    const lQs = questions.filter(q => currentIsLearnerQuestion(l, q));
    if (lQs.length > 0) {
      submittedCount++;
      submittedLearners.push({ learner: l, questions: lQs });
    } else {
      notSubmittedCount++;
      notSubmittedLearners.push(l);
    }
  });

  console.log(`Submitted: ${submittedCount}, Not Submitted: ${notSubmittedCount}`);

  // Check Dharanish. K and K. Dhanush specifically
  const dharanish = learners.find(l => l.full_name === 'Dharanish. K');
  const dhanush = learners.find(l => l.full_name === 'K. Dhanush');

  console.log('\n--- Specific Students ---');
  if (dharanish) {
    const dharanishQs = questions.filter(q => currentIsLearnerQuestion(dharanish, q));
    console.log(`Dharanish. K (id=${dharanish.id}, code=${dharanish.access_code}): matched questions = ${dharanishQs.length}`);
    console.log(`Classified as: ${dharanishQs.length > 0 ? 'SUBMITTED' : 'NOT SUBMITTED'}`);
  }
  if (dhanush) {
    const dhanushQs = questions.filter(q => currentIsLearnerQuestion(dhanush, q));
    console.log(`K. Dhanush (id=${dhanush.id}, code=${dhanush.access_code}): matched questions = ${dhanushQs.length}`);
    console.log(`Classified as: ${dhanushQs.length > 0 ? 'SUBMITTED' : 'NOT SUBMITTED'}`);
  }

  // Check what questions match NO learner at all!
  console.log('\n--- Checking Questions with NO matching learner ---');
  const unmatchedQuestions = [];
  questions.forEach(q => {
    const matchedLearners = learners.filter(l => currentIsLearnerQuestion(l, q));
    if (matchedLearners.length === 0) {
      unmatchedQuestions.push(q);
      console.log(`UNMATCHED QUESTION: ID=${q.id} | student_name="${q.student_name}" | student_id="${q.student_id}" | const="${q.constituency || q.constituency_name}"`);
    }
  });
  console.log(`Total unmatched questions: ${unmatchedQuestions.length}`);

  // Now test with benchFilter = 'Opposition'
  console.log('\n--- EVALUATING WITH benchFilter = "Opposition" ---');
  const oppLearners = learners.filter(l => (l.bench || '').toLowerCase() === 'opposition');
  const oppSubmitted = oppLearners.filter(l => questions.some(q => currentIsLearnerQuestion(l, q)));
  const oppNotSubmitted = oppLearners.filter(l => !questions.some(q => currentIsLearnerQuestion(l, q)));
  console.log(`Opposition Learners: ${oppLearners.length} | Submitted: ${oppSubmitted.length} | Not Submitted: ${oppNotSubmitted.length}`);

  // Now test with ministryFilter != 'All'
  console.log('\n--- EFFECT OF ministryFilter ON SUBMITTED LIST ---');
  const testMinistry = 'Ministry of Health & Family Welfare';
  const ministryFilteredSubmitted = oppLearners.filter(l => {
    const lQs = questions.filter(q => currentIsLearnerQuestion(l, q) && q.ministry === testMinistry);
    return lQs.length > 0;
  });
  console.log(`With ministryFilter = "${testMinistry}", Opposition submitted drops to: ${ministryFilteredSubmitted.length}!`);
}

testCalculation().catch(console.error);
