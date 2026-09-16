const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

const JKKNCET_ID = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function backupAndWipe() {
  console.log('=== STEP 1: Fetching learners for backup ===');
  
  // 1. Fetch JKKNCET learners
  const { data: cetLearners, error: cetErr } = await sb
    .from('learners')
    .select('*')
    .eq('event_id', JKKNCET_ID);

  if (cetErr) {
    console.error('Error fetching JKKNCET learners:', cetErr.message);
    process.exit(1);
  }

  // 2. Fetch NULL event_id learners
  const { data: nullLearners, error: nullErr } = await sb
    .from('learners')
    .select('*')
    .is('event_id', null);

  if (nullErr) {
    console.error('Error fetching NULL event learners:', nullErr.message);
    process.exit(1);
  }

  console.log(`Found ${cetLearners.length} JKKNCET learners and ${nullLearners.length} unassigned learners.`);

  // 3. Save backup to scratch
  const backupData = {
    timestamp: new Date().toISOString(),
    jkkncet_learners: cetLearners,
    null_event_learners: nullLearners
  };
  const backupFile = path.join(__dirname, 'backup_jkkncet_and_null_learners.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Backup successfully saved to ${backupFile}`);

  console.log('\n=== STEP 2: Deleting dependent attendance records ===');
  const allIdsToDelete = [...cetLearners.map(l => l.id), ...nullLearners.map(l => l.id)];
  
  // Batch delete attendance in chunks of 50
  for (let i = 0; i < allIdsToDelete.length; i += 50) {
    const chunk = allIdsToDelete.slice(i, i + 50);
    const { error: attErr } = await sb
      .from('event_day_attendance')
      .delete()
      .in('student_id', chunk);
    if (attErr) {
      console.warn(`Warning deleting attendance chunk ${i}:`, attErr.message);
    }
  }
  console.log('Attendance cleanup completed.');

  console.log('\n=== STEP 3: Deleting learners from Supabase ===');
  // 1. Delete JKKNCET learners
  const { data: delCet, error: delCetErr } = await sb
    .from('learners')
    .delete()
    .eq('event_id', JKKNCET_ID);

  if (delCetErr) {
    console.error('Error deleting JKKNCET learners:', delCetErr.message);
    process.exit(1);
  }
  console.log(`✅ Deleted learners with event_id = ${JKKNCET_ID}`);

  // 2. Delete NULL event_id learners
  const { data: delNull, error: delNullErr } = await sb
    .from('learners')
    .delete()
    .is('event_id', null);

  if (delNullErr) {
    console.error('Error deleting NULL event learners:', delNullErr.message);
    process.exit(1);
  }
  console.log('✅ Deleted learners with event_id IS NULL');

  console.log('\n=== STEP 4: Updating participant count for JKKNCET ===');
  await sb
    .from('college_events')
    .update({ participant_count: 0 })
    .eq('id', JKKNCET_ID);
  console.log('✅ Updated JKKNCET participant_count to 0');

  console.log('\n=== STEP 5: Verification ===');
  const { data: remainingCet } = await sb.from('learners').select('id').eq('event_id', JKKNCET_ID);
  const { data: remainingNull } = await sb.from('learners').select('id').is('event_id', null);
  const { data: totalRemaining } = await sb.from('learners').select('id, event_id');

  console.log('Remaining JKKNCET learners:', remainingCet ? remainingCet.length : 0);
  console.log('Remaining NULL event_id learners:', remainingNull ? remainingNull.length : 0);
  console.log('Total learners remaining in Supabase database:', totalRemaining ? totalRemaining.length : 0);

  const byEvent = {};
  totalRemaining.forEach(l => {
    const e = l.event_id || 'NULL';
    byEvent[e] = (byEvent[e] || 0) + 1;
  });
  console.log('Remaining learners by event:');
  console.table(byEvent);
}

backupAndWipe().catch(console.error);
