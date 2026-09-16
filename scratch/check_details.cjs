const { createClient } = require('@supabase/supabase-js');
const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

async function checkDetails() {
  const { data: learners } = await sb.from('learners').select('*');
  console.log('Total learners in DB:', learners.length);

  // Group by event_id and created_at date
  const groups = {};
  for (const l of learners) {
    const eid = l.event_id || 'NULL';
    const d = (l.created_at || '').substring(0, 10);
    const key = `${eid} | ${d}`;
    if (!groups[key]) groups[key] = { count: 0, sampleNames: [], withConst: 0, withParty: 0, withBench: 0 };
    groups[key].count++;
    if (groups[key].sampleNames.length < 3) groups[key].sampleNames.push(l.full_name);
    if (l.constituency_number) groups[key].withConst++;
    if (l.party_name) groups[key].withParty++;
    if (l.bench && l.bench !== 'Independent') groups[key].withBench++;
  }
  console.table(groups);

  // Check the 129 learners in 200fdd74-4d21-44d5-9f63-9a07bf267824
  const cet = learners.filter(l => l.event_id === '200fdd74-4d21-44d5-9f63-9a07bf267824');
  console.log('\nJKKNCET (200fdd74...) breakdown:');
  console.log('Total:', cet.length);
  console.log('Ruling bench:', cet.filter(l => l.bench === 'Ruling').length);
  console.log('Opposition bench:', cet.filter(l => l.bench === 'Opposition').length);
  console.log('Independent bench:', cet.filter(l => l.bench === 'Independent').length);
  console.log('Null bench:', cet.filter(l => !l.bench).length);
  console.log('With party_name:', cet.filter(l => Boolean(l.party_name)).length);
  console.log('With constituency_number:', cet.filter(l => Boolean(l.constituency_number)).length);
  console.log('With committee_name:', cet.filter(l => Boolean(l.committee_name)).length);

  // Check parties and committees for 200fdd74-4d21-44d5-9f63-9a07bf267824
  const { data: parties } = await sb.from('political_parties').select('*').eq('event_id', '200fdd74-4d21-44d5-9f63-9a07bf267824');
  console.log('\nParties for JKKNCET:', parties);

  const { data: comms } = await sb.from('committees').select('*').eq('event_id', '200fdd74-4d21-44d5-9f63-9a07bf267824');
  console.log('\nCommittees for JKKNCET:', comms);

  // Also check all political parties in DB
  const { data: allParties } = await sb.from('political_parties').select('id, event_id, name, bench');
  console.log('\nAll political parties in DB:');
  console.table(allParties);

  // Also check all committees in DB
  const { data: allComms } = await sb.from('committees').select('id, event_id, name');
  console.log('\nAll committees in DB:');
  console.table(allComms);
}

checkDetails();
