const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);
  const qs = event.social_coverage?.proceedings_questions || [];

  console.log(`Analyzing ${qs.length} questions against ${learners.length} learners...`);
  
  const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  qs.forEach((q, idx) => {
    const matchById = learners.find(l => l.id === q.student_id);
    const matchByNameExact = learners.find(l => l.full_name?.toLowerCase().trim() === q.student_name?.toLowerCase().trim());
    const matchByCleanName = learners.find(l => clean(l.full_name) === clean(q.student_name));
    const matchByConst = learners.find(l => clean(l.constituency_name) === clean(q.constituency || q.constituency_name));

    console.log(`${idx + 1}. Q: ${q.id} | student_name: "${q.student_name}" | student_id: ${q.student_id}`);
    console.log(`   MatchById: ${matchById ? matchById.full_name + ' (' + matchById.access_code + ')' : 'NONE'}`);
    console.log(`   MatchByNameExact: ${matchByNameExact ? matchByNameExact.full_name : 'NONE'}`);
    if (!matchByNameExact && matchByCleanName) {
      console.log(`   *** NAME FORMAT DIFFERENCE: Learner is "${matchByCleanName.full_name}" vs Question "${q.student_name}"`);
    }
    if (!matchById && matchByNameExact) {
      console.log(`   *** ID MISMATCH: Question student_id="${q.student_id}" vs Learner ID="${matchByNameExact.id}"`);
    }
  });

  // Now check all learners and see who is NOT matched
  console.log('\n=== CHECKING LEARNERS WHO MIGHT HAVE SUBMITTED QUESTIONS ===');
  learners.forEach(l => {
    const qsForL = qs.filter(q => {
      return (q.student_id && q.student_id === l.id) ||
        (clean(q.student_name) === clean(l.full_name)) ||
        (clean(q.constituency || q.constituency_name) === clean(l.constituency_name));
    });
    if (qsForL.length > 0) {
      const exactMatch = qsForL.some(q => q.student_id === l.id || q.student_name?.toLowerCase().trim() === l.full_name?.toLowerCase().trim());
      if (!exactMatch) {
        console.log(`POTENTIAL MISMATCH: Learner "${l.full_name}" (${l.constituency_name}, ID: ${l.id}) matched loosely to questions:`, qsForL.map(q => q.student_name + ' / ' + (q.constituency || q.constituency_name)));
      }
    }
  });
}

test().catch(console.error);
