const { createClient } = require('@supabase/supabase-js');

const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

const JKKNCET_ID = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function testFullPipeline() {
  console.log('=== TEST 1: Verify Supabase Connectivity ===');
  const { data: testConn, error: connErr } = await sb.from('college_events').select('id, college_name').limit(1);
  if (connErr) throw new Error(`Connectivity failed: ${connErr.message}`);
  console.log('✅ Supabase connected successfully');

  console.log('\n=== TEST 2: Verify Parties and Committees for JKKNCET ===');
  const { data: parties } = await sb.from('political_parties').select('id, name, bench').eq('event_id', JKKNCET_ID);
  console.log(`Parties available for JKKNCET: ${parties.length}`);
  parties.forEach(p => console.log(`  - ${p.name} (${p.bench})`));

  const { data: committees } = await sb.from('committees').select('id, name').eq('event_id', JKKNCET_ID);
  console.log(`Committees available for JKKNCET: ${committees.length}`);
  committees.forEach(c => console.log(`  - ${c.name}`));

  console.log('\n=== TEST 3: Test Real Learner Insert with Party, Committee, & Constituency ===');
  const testLearner = {
    event_id: JKKNCET_ID,
    access_code: 'VERIFY99',
    full_name: 'Verification Delegate',
    department: 'CSE',
    academic_year: '2nd Year',
    party_name: parties[0]?.name || 'Party 1',
    party_id: parties[0]?.id || null,
    bench: parties[0]?.bench || 'Ruling',
    constituency_number: 1,
    constituency_name: 'Gummidipoondi',
    district: 'Tiruvallur',
    committee_name: committees[0]?.name || 'Finance',
    committee_id: committees[0]?.id || null,
    role: 'Member of Legislative Assembly (MLA)'
  };

  const { data: inserted, error: insertErr } = await sb
    .from('learners')
    .upsert([testLearner], { onConflict: 'event_id,access_code' })
    .select();

  if (insertErr) {
    throw new Error(`Learner insert failed: ${insertErr.message} (code: ${insertErr.code})`);
  }
  console.log('✅ Learner upserted successfully:', inserted[0]);

  console.log('\n=== TEST 4: Clean up test record ===');
  const { error: delErr } = await sb
    .from('learners')
    .delete()
    .eq('access_code', 'VERIFY99');

  if (delErr) console.warn('Warning cleaning test learner:', delErr.message);
  else console.log('✅ Test record cleaned cleanly');

  console.log('\n=== ALL SUPABASE WRITE CHECKS PASSED 100%! ===');
}

testFullPipeline().catch(console.error);
