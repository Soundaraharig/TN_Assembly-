const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectElections() {
  console.log('=== INSPECTING ELECTIONS IN SUPABASE ===\n');

  const { data: events } = await supabase.from('college_events').select('id, college_name, social_coverage');
  for (const ev of events) {
    console.log(`Event: ${ev.college_name} (${ev.id})`);
    const sc = ev.social_coverage || {};
    const elecs = sc.elections || [];
    console.log(`  Total Elections: ${elecs.length}`);
    elecs.forEach((el, idx) => {
      console.log(`    [${idx+1}] ID: ${el.id} | Title: "${el.title}" | Status: ${el.status} | Type: ${el.type} | Total Votes: ${el.total_votes || 0} | Winner: ${el.winner_name || el.winner_id || 'none'}`);
      if (el.candidates && el.candidates.length > 0) {
        console.log(`        Candidates (${el.candidates.length}):`, el.candidates.map(c => ({ name: c.name, votes: c.votes })));
      }
    });
  }

  // Also check Chrome LevelDB dumps for any historical election data
  console.log('\n=== SEARCHING LEVELDB FILES FOR HISTORICAL ELECTIONS ===');
  const targetFiles = [
    'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
    'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
    'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
    'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
    'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
    'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
  ];

  for (const f of targetFiles) {
    if (fs.existsSync(f)) {
      const buf = fs.readFileSync(f);
      let idx = 0;
      while ((idx = buf.indexOf('tn_assembly_elections', idx)) !== -1) {
        console.log(`Found tn_assembly_elections in ${f} at offset ${idx}`);
        const slice = buf.slice(idx, idx + 2000).toString('utf8');
        console.log('Sample:', slice.slice(0, 300));
        idx += 21;
      }
    }
  }
}

inspectElections().catch(console.error);
