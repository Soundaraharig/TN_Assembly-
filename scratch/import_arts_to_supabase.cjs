const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

const ARTS_ID = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';

async function importAll() {
  console.log('=== 1. Fetching JKKN ARTS parties from Supabase ===');
  const { data: parties, error: pErr } = await sb
    .from('political_parties')
    .select('id, name, bench')
    .eq('event_id', ARTS_ID);

  if (pErr) throw new Error(`Fetch parties error: ${pErr.message}`);
  console.log(`Found ${parties.length} parties for JKKN ARTS:`);
  const partyMap = new Map();
  parties.forEach(p => {
    partyMap.set(p.name.trim().toLowerCase(), p);
    console.log(`  - ${p.name} -> ID: ${p.id} (${p.bench})`);
  });

  console.log('\n=== 2. Reading all_arts_80_delegates.csv ===');
  const csvFile = path.join(__dirname, '..', 'ARTS', 'all_arts_80_delegates.csv');
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.trim().split(/\r?\n/).slice(1);
  console.log(`Total rows to process: ${lines.length}`);

  const learners = [];
  lines.forEach((l, idx) => {
    const parts = l.split(',');
    const sNo = parts[0]?.trim();
    const name = parts[1]?.trim();
    const code = parts[2]?.trim().toUpperCase();
    const constNo = parseInt(parts[3]?.trim(), 10) || null;
    const constName = parts[4]?.trim() || null;
    const partyName = parts[5]?.trim() || null;

    const matchedParty = partyName ? partyMap.get(partyName.toLowerCase()) : null;

    learners.push({
      id: crypto.randomUUID(),
      event_id: ARTS_ID,
      access_code: code,
      full_name: name,
      constituency_number: constNo,
      constituency_name: constName,
      party_name: matchedParty ? matchedParty.name : partyName,
      party_id: matchedParty ? matchedParty.id : null,
      bench: matchedParty ? matchedParty.bench : 'Independent',
      role: 'Member of Legislative Assembly (MLA)',
      department: 'General',
      academic_year: '1st Year',
      day1_checked_in: false,
      day2_checked_in: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  console.log('\n=== 3. Cleaning any existing learners for ARTS event first ===');
  const { error: delErr } = await sb.from('learners').delete().eq('event_id', ARTS_ID);
  if (delErr) console.warn('Delete warning:', delErr.message);

  console.log('\n=== 4. Inserting 80 delegates to Supabase ===');
  for (let i = 0; i < learners.length; i += 50) {
    const chunk = learners.slice(i, i + 50);
    const { error: insErr } = await sb.from('learners').insert(chunk);
    if (insErr) {
      throw new Error(`Insert chunk error: ${insErr.message}`);
    }
  }
  console.log('✅ All 80 learners inserted into Supabase learners table!');

  console.log('\n=== 5. Updating college_events participant_count to 80 ===');
  const { error: evErr } = await sb
    .from('college_events')
    .update({ participant_count: learners.length })
    .eq('id', ARTS_ID);

  if (evErr) console.warn('Event count update warning:', evErr.message);
  else console.log(`✅ Updated JKKN ARTS participant_count to ${learners.length}`);

  console.log('\n=== 6. Verification ===');
  const { count } = await sb
    .from('learners')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', ARTS_ID);

  console.log(`Total active learners in JKKN ARTS: ${count}`);

  const { data: sample } = await sb
    .from('learners')
    .select('full_name, access_code, constituency_number, constituency_name, party_name, bench')
    .eq('event_id', ARTS_ID)
    .limit(5);

  console.log('Sample delegates:');
  console.table(sample);
}

importAll().catch(console.error);
