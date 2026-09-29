const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);

  const questions = event.social_coverage.proceedings_questions || [];
  console.log(`Total questions: ${questions.length}, Total learners: ${learners.length}`);

  console.log('\n--- ALL QUESTIONS ---');
  questions.forEach((q, idx) => {
    console.log(`[Q#${idx + 1}] ID=${q.id} student_id=${q.student_id} student_name="${q.student_name}" const="${q.constituency || q.constituency_name}" min="${q.ministry}"`);
  });

  console.log('\n--- MATCHING SUMMARY ---');
  let matchedCount = 0;
  let unmatchedQuestions = [];

  questions.forEach((q, idx) => {
    // Current isLearnerQuestion logic in ProceedingsTab:
    // q.student_id === l.id || (q.student_name && l.full_name && q.student_name.trim().toLowerCase() === l.full_name.trim().toLowerCase())
    const exactIdMatch = learners.find(l => l.id === q.student_id);
    const exactNameMatch = learners.find(l => l.full_name && q.student_name && l.full_name.trim().toLowerCase() === q.student_name.trim().toLowerCase());
    
    if (exactIdMatch || exactNameMatch) {
      matchedCount++;
    } else {
      unmatchedQuestions.push({ idx: idx + 1, q });
    }
  });

  console.log(`Matched questions with exact logic: ${matchedCount} / ${questions.length}`);
  console.log(`Unmatched questions: ${unmatchedQuestions.length}`);
  unmatchedQuestions.forEach(u => {
    console.log(`Unmatched Q#${u.idx}: ID=${u.q.id}, name="${u.q.student_name}", student_id=${u.q.student_id}, const="${u.q.constituency || u.q.constituency_name}"`);
    // Search for near matches in learners
    const near = learners.filter(l => {
      const qTokens = (u.q.student_name || '').toLowerCase().split(/[\s.]+/).filter(Boolean);
      const lTokens = (l.full_name || '').toLowerCase().split(/[\s.]+/).filter(Boolean);
      return qTokens.some(t => lTokens.includes(t)) || (l.constituency_name && u.q.constituency && l.constituency_name.toLowerCase().includes(u.q.constituency.toLowerCase()));
    });
    console.log('  Possible learner matches:', near.map(l => `[${l.id}] "${l.full_name}" (const: ${l.constituency_name})`));
  });
}

run().catch(console.error);
