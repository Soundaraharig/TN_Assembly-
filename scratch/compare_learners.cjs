const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const file = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000325.log';
const buf = fs.readFileSync(file);
const target = 'tn_assembly_learners_v6';
const idx = buf.indexOf(target);
const startBracket = buf.indexOf('[', idx);
const rawStr = buf.slice(startBracket).toString('utf8');
const matches = rawStr.match(/\{"id":"[a-f0-9\-]+"[^\}]+\}/g) || [];

const chromeLearners = [];
for (const m of matches) {
  try {
    const obj = JSON.parse(m);
    if (obj.id && obj.access_code) chromeLearners.push(obj);
  } catch (e) {}
}

const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

async function compare() {
  const { data: dbLearners } = await sb.from('learners').select('*');
  console.log('Chrome leveldb learners count:', chromeLearners.length);
  console.log('Supabase learners count:', dbLearners.length);

  // Check matching by access_code or id
  const dbById = new Map(dbLearners.map(l => [l.id, l]));
  const dbByCode = new Map(dbLearners.map(l => [l.access_code, l]));

  let matchedId = 0;
  let matchedCode = 0;
  let fullyAllocatedInChrome = 0;

  for (const cl of chromeLearners) {
    if (cl.party_name && cl.constituency_number) fullyAllocatedInChrome++;
    if (dbById.has(cl.id)) matchedId++;
    if (dbByCode.has(cl.access_code)) matchedCode++;
  }

  console.log('Chrome learners with full allocations:', fullyAllocatedInChrome);
  console.log('Matches by ID in Supabase:', matchedId);
  console.log('Matches by AccessCode in Supabase:', matchedCode);

  // Check a sample match
  const sampleChrome = chromeLearners.find(cl => cl.party_name && cl.constituency_number);
  if (sampleChrome) {
    console.log('\n--- Sample in Chrome LevelDB ---');
    console.log({
      id: sampleChrome.id,
      name: sampleChrome.full_name,
      code: sampleChrome.access_code,
      party: sampleChrome.party_name,
      bench: sampleChrome.bench,
      constituency_no: sampleChrome.constituency_number,
      constituency_name: sampleChrome.constituency_name,
      committee: sampleChrome.committee_name,
      event_id: sampleChrome.event_id
    });

    const inDb = dbById.get(sampleChrome.id) || dbByCode.get(sampleChrome.access_code);
    console.log('\n--- Corresponding Record in Supabase DB ---');
    if (inDb) {
      console.log({
        id: inDb.id,
        name: inDb.full_name,
        code: inDb.access_code,
        party: inDb.party_name,
        bench: inDb.bench,
        constituency_no: inDb.constituency_number,
        constituency_name: inDb.constituency_name,
        committee: inDb.committee_name,
        event_id: inDb.event_id,
        created_at: inDb.created_at,
        updated_at: inDb.updated_at
      });
    } else {
      console.log('NOT FOUND in Supabase DB!');
    }
  }
}

compare();
