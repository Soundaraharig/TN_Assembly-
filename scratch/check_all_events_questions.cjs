const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllEventsAndQuestions() {
  const { data: events, error } = await supabase.from('college_events').select('id, college_name, slug, social_coverage');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Total events in college_events: ${events.length}`);
  events.forEach((ev, i) => {
    const sc = ev.social_coverage || {};
    const pqs = sc.proceedings_questions || [];
    const qs = sc.questions || [];
    const del = sc.deleted_question_ids || [];
    console.log(`[Event ${i+1}] "${ev.college_name}" (id: ${ev.id}, slug: ${ev.slug}) -> proceedings_questions: ${pqs.length}, questions: ${qs.length}, deleted_q: ${del.length}`);
    
    pqs.forEach((q, qIdx) => {
      const s = JSON.stringify(q).toLowerCase();
      if (s.includes('dhanush') || s.includes('aravakurichi') || s.includes('rfnqnu') || s.includes('cf05e4af')) {
        console.log(`  MATCH in pqs[${qIdx}]: id=${q.id}, name="${q.student_name}", const="${q.constituency || q.constituency_name}", target="${q.ministry}"`);
      }
    });

    qs.forEach((q, qIdx) => {
      const s = JSON.stringify(q).toLowerCase();
      if (s.includes('dhanush') || s.includes('aravakurichi') || s.includes('rfnqnu') || s.includes('cf05e4af')) {
        console.log(`  MATCH in qs[${qIdx}]: id=${q.id}, name="${q.student_name}", const="${q.constituency || q.constituency_name}", target="${q.ministry}"`);
      }
    });
  });
}

checkAllEventsAndQuestions().catch(console.error);
