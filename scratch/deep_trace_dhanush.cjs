const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('id, college_name, social_coverage').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);

  const questions = event.social_coverage.proceedings_questions || [];

  // Check how many unique learners have submitted
  const submitterIds = new Set(questions.map(q => q.student_id).filter(Boolean));
  console.log(`Unique student_ids in questions: ${submitterIds.size}`);

  // Find all learners where id in submitterIds
  const submittedLearners = learners.filter(l => submitterIds.has(l.id));
  console.log(`Learners matching submitterIds: ${submittedLearners.length}`);

  // Check K. Dhanush:
  const dhanush = learners.find(l => l.full_name?.toLowerCase().includes('dhanush') && !l.full_name?.toLowerCase().includes('dhanushkasri'));
  console.log('K. Dhanush learner:', dhanush ? { id: dhanush.id, name: dhanush.full_name, access_code: dhanush.access_code, constituency: dhanush.constituency_name, bench: dhanush.bench } : 'NOT FOUND');

  // Check Dharanish. K:
  const dharanish = learners.find(l => l.full_name?.toLowerCase().includes('dharanish'));
  console.log('Dharanish. K learner:', dharanish ? { id: dharanish.id, name: dharanish.full_name, access_code: dharanish.access_code, constituency: dharanish.constituency_name, bench: dharanish.bench } : 'NOT FOUND');

  // Check if K. Dhanush has a question with his student_id
  const dhanushQById = questions.filter(q => q.student_id === dhanush?.id);
  console.log('Questions with K. Dhanush student_id:', dhanushQById.length);

  // Check if any question has K. Dhanush in student_name or question_text
  const dhanushQByName = questions.filter(q => (q.student_name && q.student_name.toLowerCase().includes('dhanush') && !q.student_name.toLowerCase().includes('dhanushkasri')));
  console.log('Questions with "Dhanush" in student_name:', dhanushQByName.length);

  // Check questions where student_name matches any learner
  const unmatchedQs = questions.filter(q => !learners.some(l => l.id === q.student_id || (l.full_name && q.student_name && l.full_name.trim().toLowerCase() === q.student_name.trim().toLowerCase())));
  console.log('Unmatched questions in JKKNCET:', unmatchedQs.length);

  // Check all other events in college_events to see if K. Dhanush submitted to another event!
  const { data: allEvents } = await supabase.from('college_events').select('id, college_name, slug, social_coverage');
  allEvents.forEach(ev => {
    const qs = ev.social_coverage?.proceedings_questions || [];
    const dq = qs.filter(q => 
      (q.student_name && q.student_name.toLowerCase().includes('dhanush') && !q.student_name.toLowerCase().includes('dhanushkasri')) ||
      (dhanush && q.student_id === dhanush.id)
    );
    if (dq.length > 0) {
      console.log(`Found ${dq.length} Dhanush question(s) in event "${ev.college_name}" (${ev.id})`);
      dq.forEach(q => console.log('  Q:', q.id, q.student_name, q.student_id, q.event_id, q.ministry, q.question_text?.substring(0, 50)));
    }
  });
}

run().catch(console.error);
