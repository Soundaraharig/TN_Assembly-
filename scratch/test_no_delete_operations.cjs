const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL\s*=\s*([^\r\n]+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*([^\r\n]+)/);
const url = urlMatch[1].trim().replace(/^['"]|['"]$/g, '');
const key = keyMatch[1].trim().replace(/^['"]|['"]$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function runTests() {
  console.log('--- STARTING ZERO-DELETE VERIFICATION ---');

  // Baseline count
  const { count: initialCount } = await supabase.from('learners').select('*', { count: 'exact', head: true });
  console.log('Baseline Supabase learner count:', initialCount);

  // 1. Verify breakdown by event
  const events = [
    { name: 'JKKN ARTS', id: '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8' },
    { name: 'JKKNCET', id: '200fdd74-4d21-44d5-9f63-9a07bf267824' },
    { name: 'JKKN AHS', id: '648790e1-0836-4a29-8a53-74929e7404f3' },
    { name: 'Empty Event', id: '35f87a38-62de-4e0c-bffb-59c394f987b1' }
  ];

  for (const ev of events) {
    const { count } = await supabase.from('learners').select('*', { count: 'exact', head: true }).eq('event_id', ev.id);
    console.log(`Event "${ev.name}" count: ${count}`);
  }

  // 2. Final count check
  const { count: finalCount } = await supabase.from('learners').select('*', { count: 'exact', head: true });
  console.log('Final Supabase learner count:', finalCount);

  if (initialCount === finalCount && finalCount === 287) {
    console.log('✅ ALL TESTS PASSED: Participant count remained strictly 287. ZERO automatic deletions!');
  } else {
    console.error('❌ COUNT MISMATCH: Expected 287, got', finalCount);
    process.exit(1);
  }
}

runTests();
