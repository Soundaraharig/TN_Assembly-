const { createClient } = require('@supabase/supabase-js');
const assert = require('assert');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBatchTest() {
  console.log('=== VERIFYING BATCH ATTENDANCE (MARK ALL PRESENT / RESET ALL ABSENT) ===\n');

  const eventId = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';

  // 1. Identify Day 1 row in event_days
  const { data: eventDays, error: edErr } = await supabase
    .from('event_days')
    .select('*')
    .eq('event_id', eventId)
    .order('day_number', { ascending: true });

  assert(!edErr, 'Failed to fetch event_days: ' + edErr?.message);
  const day1Row = eventDays.find(d => d.day_number === 1) || eventDays[0];
  const actualDayId = day1Row.id;
  console.log(`Using Day 1 -> id: ${actualDayId}`);

  // 2. Select 5 test delegates
  const { data: learners, error: lErr } = await supabase
    .from('learners')
    .select('id, full_name')
    .eq('event_id', eventId)
    .limit(5);

  assert(!lErr && learners.length >= 3, 'Not enough learners');
  const studentIds = learners.map(l => l.id);
  console.log(`Testing with ${studentIds.length} delegates.`);

  // Clean any existing attendance for these 5 delegates
  await supabase
    .from('event_day_attendance')
    .delete()
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .in('student_id', studentIds);

  // Helper function for batch attendance
  async function batchSetAttendance(status) {
    const timestamp = new Date().toISOString();
    // 1. Fetch existing rows
    const { data: existingRows, error: fErr } = await supabase
      .from('event_day_attendance')
      .select('id, student_id')
      .eq('event_id', eventId)
      .eq('day_id', actualDayId)
      .in('student_id', studentIds);

    if (fErr) throw fErr;

    const existingMap = new Map((existingRows || []).map(r => [r.student_id, r.id]));
    const existingStudentIds = [];
    const newRecords = [];

    studentIds.forEach(stId => {
      if (existingMap.has(stId)) {
        existingStudentIds.push(stId);
      } else {
        newRecords.push({
          event_id: eventId,
          day_id: actualDayId,
          student_id: stId,
          status,
          marked_by: 'Floor Volunteer',
          marked_by_role: 'volunteer',
          marked_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp
        });
      }
    });

    // Bulk update existing
    if (existingStudentIds.length > 0) {
      const { error: upErr } = await supabase
        .from('event_day_attendance')
        .update({
          status,
          marked_by: 'Floor Volunteer',
          marked_by_role: 'volunteer',
          marked_at: timestamp,
          updated_at: timestamp
        })
        .eq('event_id', eventId)
        .eq('day_id', actualDayId)
        .in('student_id', existingStudentIds);

      if (upErr) throw upErr;
    }

    // Bulk insert new
    if (newRecords.length > 0) {
      const { error: inErr } = await supabase
        .from('event_day_attendance')
        .insert(newRecords);

      if (inErr) throw inErr;
    }
  }

  // TEST STEP 1: Mark All Present
  console.log('\n--- Step 1: Mark All Present ---');
  await batchSetAttendance('Present');

  const { data: rowsAfterPresent } = await supabase
    .from('event_day_attendance')
    .select('id, student_id, status')
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .in('student_id', studentIds);

  assert.strictEqual(rowsAfterPresent.length, studentIds.length);
  assert(rowsAfterPresent.every(r => r.status === 'Present'));
  const rowIdsFirstPass = new Set(rowsAfterPresent.map(r => r.id));
  console.log(`✅ All ${studentIds.length} marked Present.`);

  // TEST STEP 2: Reset All Absent
  console.log('\n--- Step 2: Reset All Absent ---');
  await batchSetAttendance('Absent');

  const { data: rowsAfterAbsent } = await supabase
    .from('event_day_attendance')
    .select('id, student_id, status')
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .in('student_id', studentIds);

  assert.strictEqual(rowsAfterAbsent.length, studentIds.length);
  assert(rowsAfterAbsent.every(r => r.status === 'Absent'));
  // Verify that the EXACT SAME rows were updated (no duplicate rows created)
  rowsAfterAbsent.forEach(r => {
    assert(rowIdsFirstPass.has(r.id), `Row ${r.id} is new, expected reuse of existing row`);
  });
  console.log(`✅ All ${studentIds.length} updated to Absent on the SAME rows without duplicates.`);

  // Clean up
  await supabase
    .from('event_day_attendance')
    .delete()
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .in('student_id', studentIds);

  console.log('\n=== BATCH ATTENDANCE VERIFIED SUCCESSFULLY ===');
}

runBatchTest().catch(err => {
  console.error('BATCH TEST FAILED:', err);
  process.exit(1);
});
