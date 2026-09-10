const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendancePayload() {
  console.log('=== TESTING ATTENDANCE PAYLOAD ===');

  // Let's first check if we can insert an event_day for event 05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8 (JKKN ARTS)
  // using its actual ID '2d56f252-391d-41f5-9dcd-2e0504fc4d4b'!
  // Wait, is '2d56f252-391d-41f5-9dcd-2e0504fc4d4b' the exact ID that was in social_coverage.event_days?
  // YES! It is Day 1 of JKKN ARTS!
  
  const eventId = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';
  const day1Id = '2d56f252-391d-41f5-9dcd-2e0504fc4d4b';

  console.log('Testing insert into event_days with the actual day 1 ID...');
  const { data: dayRow, error: dayErr } = await supabase.from('event_days').upsert({
    id: day1Id,
    event_id: eventId,
    day_number: 1,
    name: 'Day 1',
    status: 'Active',
    activities: ["Student Orientation","Party & Constituency Allocation + Group Formation"]
  }, { onConflict: 'id' }).select();

  console.log('Insert event_days result:', dayRow, 'Error:', dayErr);

  // Now, test inserting into event_day_attendance!
  // Pick one learner from JKKN ARTS
  const { data: learners } = await supabase.from('learners').select('id, full_name').eq('event_id', eventId).limit(1);
  const testStudent = learners[0];
  console.log('Test student:', testStudent);

  if (testStudent && !dayErr) {
    console.log('\nTesting inserting attendance with day_id = dayRow.id...');
    const attPayload = {
      event_id: eventId,
      day_id: day1Id,
      student_id: testStudent.id,
      status: 'Present',
      marked_by: 'Floor Volunteer',
      marked_by_role: 'volunteer'
    };

    const { data: attData, error: attErr } = await supabase.from('event_day_attendance').upsert(attPayload, {
      onConflict: 'event_id,day_id,student_id'
    }).select();

    console.log('Attendance insert without event_day_id result:', attData, 'Error:', attErr);

    // Now test UPDATE to Absent
    console.log('\nTesting updating attendance to Absent...');
    const { data: upData, error: upErr } = await supabase
      .from('event_day_attendance')
      .update({ status: 'Absent' })
      .eq('event_id', eventId)
      .eq('day_id', day1Id)
      .eq('student_id', testStudent.id)
      .select();

    console.log('Update result:', upData, 'Error:', upErr);

    // Clean up test attendance
    await supabase.from('event_day_attendance').delete().eq('id', attData[0]?.id);
    // Keep or remove dayRow? Wait, dayRow is the actual Day 1 of JKKN ARTS!
  }
}

testAttendancePayload().catch(console.error);
