const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);

  const qs = event.social_coverage.proceedings_questions || [];
  console.log(`Questions (${qs.length}):`);
  qs.forEach((q, i) => {
    const l = learners.find(x => x.id === q.student_id);
    console.log(`${i+1}. id: ${q.id} | student_name: "${q.student_name}" | learner_matched: "${l ? l.full_name : 'NONE'}" (id: ${q.student_id}) | const: "${q.constituency || q.constituency_name}" | ministry: "${q.ministry}" | status: "${q.status}"`);
  });
}

listAll().catch(console.error);
