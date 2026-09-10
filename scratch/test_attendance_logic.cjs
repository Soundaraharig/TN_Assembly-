const { createClient } = require('@supabase/supabase-js');
const assert = require('assert');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('=== VERIFYING ATTENDANCE UPSERT LIFECYCLE ===\n');

  const eventId = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';

  // 1. Identify Day 1 row in event_days
  const { data: eventDays, error: edErr } = await supabase
    .from('event_days')
    .select('*')
    .eq('event_id', eventId)
    .order('day_number', { ascending: true });

  assert(!edErr, 'Failed to fetch event_days: ' + edErr?.message);
  assert(eventDays && eventDays.length > 0, 'No event_days found in DB');

  const day1Row = eventDays.find(d => d.day_number === 1) || eventDays[0];
  console.log(`Found Day 1 in event_days -> id: ${day1Row.id}, day_number: ${day1Row.day_number}, name: ${day1Row.name}`);

  const actualDayId = day1Row.id;

  // 2. Select one delegate
  const { data: learners, error: lErr } = await supabase
    .from('learners')
    .select('id, full_name')
    .eq('event_id', eventId)
    .limit(5);

  assert(!lErr && learners.length > 0, 'No learners found');
  const testLearner = learners[0];
  console.log(`Test delegate -> id: ${testLearner.id}, name: ${testLearner.full_name}\n`);

  // Clean any previous attendance for testLearner
  await supabase
    .from('event_day_attendance')
    .delete()
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .eq('student_id', testLearner.id);

  // Helper for attendance upsert logic exactly as required
  async function setAttendance(status) {
    const timestamp = new Date().toISOString();
    // A. Find existing attendance record
    const { data: existing, error: findErr } = await supabase
      .from('event_day_attendance')
      .select('*')
      .eq('event_id', eventId)
      .eq('day_id', actualDayId)
      .eq('student_id', testLearner.id)
      .maybeSingle();

    if (findErr) throw findErr;

    if (existing) {
      // UPDATE
      console.log(`[ACTION: UPDATE] existing id=${existing.id} -> ${status}`);
      const { data: updated, error: upErr } = await supabase
        .from('event_day_attendance')
        .update({
          status,
          marked_by: 'Test Floor Volunteer',
          marked_by_role: 'volunteer',
          marked_at: timestamp,
          updated_at: timestamp
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (upErr) throw upErr;
      return { action: 'UPDATE', record: updated };
    } else {
      // INSERT
      console.log(`[ACTION: INSERT] new row for delegate ${testLearner.id} -> ${status}`);
      const { data: inserted, error: inErr } = await supabase
        .from('event_day_attendance')
        .insert({
          event_id: eventId,
          day_id: actualDayId,
          student_id: testLearner.id,
          status,
          marked_by: 'Test Floor Volunteer',
          marked_by_role: 'volunteer',
          marked_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (inErr) throw inErr;
      return { action: 'INSERT', record: inserted };
    }
  }

  // TEST STEP 1: Click Present
  console.log('--- Step 1: Click Present ---');
  const res1 = await setAttendance('Present');
  assert.strictEqual(res1.action, 'INSERT');
  assert.strictEqual(res1.record.status, 'Present');
  assert.strictEqual(res1.record.day_id, actualDayId);
  const initialRowId = res1.record.id;
  console.log(`✅ Step 1 passed. Row created with id=${initialRowId}`);

  // Check row count in DB
  const { count: c1 } = await supabase
    .from('event_day_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .eq('student_id', testLearner.id);
  assert.strictEqual(c1, 1, 'Expected exactly 1 row');

  // TEST STEP 2: Click Absent
  console.log('\n--- Step 2: Click Absent ---');
  const res2 = await setAttendance('Absent');
  assert.strictEqual(res2.action, 'UPDATE');
  assert.strictEqual(res2.record.id, initialRowId, 'Must update the SAME row');
  assert.strictEqual(res2.record.status, 'Absent');
  console.log(`✅ Step 2 passed. SAME row updated to Absent.`);

  // Check row count in DB
  const { count: c2 } = await supabase
    .from('event_day_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .eq('student_id', testLearner.id);
  assert.strictEqual(c2, 1, 'Expected exactly 1 row');

  // TEST STEP 3: Click Present again
  console.log('\n--- Step 3: Click Present again ---');
  const res3 = await setAttendance('Present');
  assert.strictEqual(res3.action, 'UPDATE');
  assert.strictEqual(res3.record.id, initialRowId, 'Must update the SAME row');
  assert.strictEqual(res3.record.status, 'Present');
  console.log(`✅ Step 3 passed. SAME row updated to Present.`);

  // Final count
  const { count: c3 } = await supabase
    .from('event_day_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('day_id', actualDayId)
    .eq('student_id', testLearner.id);
  assert.strictEqual(c3, 1, 'Expected exactly 1 row');
  console.log(`✅ Zero duplicate rows, zero 409 conflicts, zero foreign key errors!`);

  // Clean up test row
  await supabase.from('event_day_attendance').delete().eq('id', initialRowId);
  console.log('\n=== ALL TEST STEPS PASSED SUCCESSFULLY ===');
}

runTest().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
