/**
 * Fix Party 1 Learners party_id in Supabase for JKKNCET
 * Event ID: 200fdd74-4d21-44d5-9f63-9a07bf267824
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const key = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/)[1].trim();
const url = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/)[1].trim();

const supabase = createClient(url, key);
const JKKNCET_ID = '200fdd74-4d21-44d5-9f63-9a07bf267824';
const JKKNCET_PARTY_1_ID = '2be0c6b5-3d94-451f-b7b3-5c6334bf0020';

async function main() {
  console.log('=== FIXING PARTY 1 LEARNERS IN SUPABASE ===');

  // 1. Fetch Party 1 learners in JKKNCET
  const { data: learners, error: fErr } = await supabase
    .from('learners')
    .select('id, full_name, party_id, party_name')
    .eq('event_id', JKKNCET_ID)
    .eq('party_name', 'Party 1');

  if (fErr) {
    console.error('Fetch error:', fErr);
    process.exit(1);
  }

  console.log(`Found ${learners.length} learners belonging to Party 1 in JKKNCET.`);

  // 2. Update their party_id to JKKNCET_PARTY_1_ID
  const { data: updateData, error: uErr } = await supabase
    .from('learners')
    .update({ party_id: JKKNCET_PARTY_1_ID })
    .eq('event_id', JKKNCET_ID)
    .eq('party_name', 'Party 1')
    .select('id, full_name, party_id, party_name');

  if (uErr) {
    console.error('Update error:', uErr);
    process.exit(1);
  }

  console.log(`Successfully updated ${updateData.length} learners with correct Party 1 ID (${JKKNCET_PARTY_1_ID})!`);

  // 3. Verification audit
  const { data: checkLearners } = await supabase
    .from('learners')
    .select('id, full_name, party_id, party_name')
    .eq('event_id', JKKNCET_ID)
    .eq('party_id', JKKNCET_PARTY_1_ID);

  console.log(`Verification: Total learners with JKKNCET Party 1 ID is now: ${checkLearners.length}`);
}

main().catch(console.error);
