const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepCheck() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: ev } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const sc = ev.social_coverage || {};

  console.log('--- Checking all arrays in social_coverage ---');
  for (const [k, v] of Object.entries(sc)) {
    if (Array.isArray(v)) {
      const match = v.filter(item => {
        const s = JSON.stringify(item).toLowerCase();
        return s.includes('dhanush') || s.includes('aravakurichi') || s.includes('rfnqnu') || s.includes('cf05e4af');
      });
      if (match.length > 0) {
        console.log(`Key "${k}" (length ${v.length}) has ${match.length} matches:`);
        match.forEach(m => console.log('  ', JSON.stringify(m).substring(0, 300)));
      }
    }
  }

  // Check sc.questions vs sc.proceedings_questions
  console.log(`sc.questions length: ${Array.isArray(sc.questions) ? sc.questions.length : typeof sc.questions}`);
  if (Array.isArray(sc.questions)) {
    sc.questions.forEach((q, i) => {
      console.log(`sc.questions[${i}]: id=${q.id}, name=${q.student_name || q.full_name}, const=${q.constituency}`);
    });
  }

  // Check audit log
  const audit = sc.vote_audit_log || [];
  console.log(`vote_audit_log length: ${audit.length}`);
  const dhanushAudit = audit.filter(a => JSON.stringify(a).toLowerCase().includes('dhanush') || JSON.stringify(a).toLowerCase().includes('aravakurichi'));
  console.log(`Dhanush in vote_audit_log: ${dhanushAudit.length}`);
  dhanushAudit.forEach(a => console.log('Audit:', a));

  // Check all 52 proceedings_questions: list student_name and constituency
  console.log('\n--- ALL 52 proceedings_questions in DB ---');
  (sc.proceedings_questions || []).forEach((q, i) => {
    console.log(`${i+1}. id: ${q.id} | student_name: "${q.student_name}" | student_id: ${q.student_id} | const: "${q.constituency || q.constituency_name}" (num: ${q.constituency_number}) | ministry: "${q.ministry}" | status: "${q.status}"`);
  });
}

deepCheck().catch(console.error);
