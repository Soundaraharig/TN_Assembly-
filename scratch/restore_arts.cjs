const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

const ARTS_EVENT_ID = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';

async function restoreArts() {
  const backupFile = path.join(__dirname, 'backup_jkkncet_and_null_learners.json');
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  // Get the 84 learners created on 2026-09-15
  const sept15Learners = backup.null_event_learners.filter(l => l.created_at && l.created_at.startsWith('2026-09-15'));
  
  // Also find if any Sept 11 candidates matched ARTS nominations
  const sept11Learners = backup.null_event_learners.filter(l => l.created_at && l.created_at.startsWith('2026-09-11'));

  console.log(`Sept 15 learners: ${sept15Learners.length}`);
  console.log(`Sept 11 learners: ${sept11Learners.length}`);

  // Assign them to ARTS_EVENT_ID
  const recordsToInsert = sept15Learners.map(l => ({
    ...l,
    event_id: ARTS_EVENT_ID
  }));

  console.log(`Restoring ${recordsToInsert.length} learners directly to JKKN ARTS (${ARTS_EVENT_ID})...`);

  // Insert in chunks of 50
  for (let i = 0; i < recordsToInsert.length; i += 50) {
    const chunk = recordsToInsert.slice(i, i + 50);
    const { data, error } = await sb.from('learners').upsert(chunk);
    if (error) {
      console.error(`Chunk error at ${i}:`, error.message);
      process.exit(1);
    }
  }

  // Update participant_count in college_events to match
  await sb
    .from('college_events')
    .update({ participant_count: recordsToInsert.length })
    .eq('id', ARTS_EVENT_ID);

  console.log(`✅ Successfully restored ${recordsToInsert.length} learners to JKKN ARTS event in Supabase!`);

  // Verify
  const { count } = await sb
    .from('learners')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', ARTS_EVENT_ID);

  console.log(`Verification: Learners now in JKKN ARTS table = ${count}`);
}

restoreArts().catch(console.error);
