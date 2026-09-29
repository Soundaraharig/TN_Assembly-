const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  console.log(`Inspecting JKKNCET event: ${eventId}`);

  // 1. Fetch event
  const { data: event, error: evErr } = await supabase
    .from('college_events')
    .select('id, college_name, slug, social_coverage')
    .eq('id', eventId)
    .single();

  if (evErr) {
    console.error('Error fetching event:', evErr);
  } else {
    console.log(`Event Found: ${event.college_name} (${event.slug})`);
  }

  // 2. Fetch learners
  const { data: learners, error: lrnErr } = await supabase
    .from('learners')
    .select('*')
    .eq('event_id', eventId);

  if (lrnErr) {
    console.error('Error fetching learners:', lrnErr);
  } else {
    console.log(`Total Learners in JKKNCET: ${learners.length}`);
    const dhanushList = learners.filter(l => 
      (l.full_name && l.full_name.toLowerCase().includes('dhanush')) ||
      (l.name && l.name.toLowerCase().includes('dhanush')) ||
      (l.full_name && l.full_name.toLowerCase().includes('dharanish')) ||
      (l.access_code && l.access_code.toLowerCase().includes('dhanush'))
    );
    console.log(`Matching Dhanush/Dharanish learners found: ${dhanushList.length}`);
    dhanushList.forEach(l => console.log('Learner record:', JSON.stringify(l, null, 2)));
  }

  // 3. Fetch proceedings_questions table
  const { data: questions, error: qErr } = await supabase
    .from('proceedings_questions')
    .select('*')
    .eq('event_id', eventId);

  if (qErr) {
    console.error('Error fetching proceedings_questions:', qErr);
  } else {
    console.log(`Total proceedings_questions rows in JKKNCET: ${questions.length}`);
    const dhanushQs = questions.filter(q => 
      (q.student_name && q.student_name.toLowerCase().includes('dhanush')) ||
      (q.student_name && q.student_name.toLowerCase().includes('dharanish')) ||
      (q.question_text && q.question_text.toLowerCase().includes('dhanush')) ||
      (q.student_id && learners.some(l => l.id === q.student_id && (l.full_name?.toLowerCase().includes('dhanush') || l.full_name?.toLowerCase().includes('dharanish'))))
    );
    console.log(`Matching Dhanush questions in proceedings_questions: ${dhanushQs.length}`);
    dhanushQs.forEach(q => console.log('Question record:', JSON.stringify(q, null, 2)));
  }

  // 4. Check questions stored in event.social_coverage
  const sc = event?.social_coverage || {};
  const scQuestions = sc.proceedings_questions || sc.questions || [];
  console.log(`Questions in social_coverage: ${Array.isArray(scQuestions) ? scQuestions.length : typeof scQuestions}`);
  if (Array.isArray(scQuestions) && scQuestions.length > 0) {
    const scDhanushQs = scQuestions.filter(q =>
      (q.student_name && q.student_name.toLowerCase().includes('dhanush')) ||
      (q.student_name && q.student_name.toLowerCase().includes('dharanish')) ||
      (q.question_text && q.question_text.toLowerCase().includes('dhanush'))
    );
    console.log(`Matching Dhanush questions in social_coverage: ${scDhanushQs.length}`);
    scDhanushQs.forEach(q => console.log('SC Question record:', JSON.stringify(q, null, 2)));
  }

  // 5. Also check if there are questions in 'questions' table
  const { data: oldQs, error: oldQErr } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', eventId);

  if (!oldQErr && oldQs) {
    console.log(`Total questions in old 'questions' table: ${oldQs.length}`);
    const oldDhanush = oldQs.filter(q =>
      (q.student_name && q.student_name.toLowerCase().includes('dhanush')) ||
      (q.question_text && q.question_text.toLowerCase().includes('dhanush'))
    );
    console.log(`Matching Dhanush in 'questions' table: ${oldDhanush.length}`);
    oldDhanush.forEach(q => console.log('Old Question:', JSON.stringify(q, null, 2)));
  }
}

inspect().catch(console.error);
