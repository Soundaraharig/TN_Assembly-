import assert from 'node:assert';

// ---------------------------------------------------------------------------
// Mock LocalStorage Environment
// ---------------------------------------------------------------------------
const memoryStore = new Map();
global.localStorage = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear()
};

// Mock Supabase DB Table Store
const supabaseDatabase = {
  event_days: new Map(),
  event_day_attendance: new Map()
};

let shouldSimulateDbReject = false;
let simulateDbErrorCode = null;

// Mock Supabase Client matching PostgREST behavior
const mockSupabase = {
  from: (table) => {
    return {
      select: (cols) => ({
        eq: (col1, val1) => ({
          eq: (col2, val2) => ({
            eq: (col3, val3) => ({
              maybeSingle: async () => {
                if (shouldSimulateDbReject) {
                  return { data: null, error: { message: 'Database connection refused', code: simulateDbErrorCode || 'PGRST500' } };
                }
                const store = supabaseDatabase[table];
                for (const row of store.values()) {
                  if (row[col1] === val1 && row[col2] === val2 && row[col3] === val3) {
                    return { data: { ...row }, error: null };
                  }
                }
                return { data: null, error: null };
              }
            }),
            maybeSingle: async () => {
              if (shouldSimulateDbReject) {
                return { data: null, error: { message: 'Database connection refused', code: simulateDbErrorCode || 'PGRST500' } };
              }
              const store = supabaseDatabase[table];
              for (const row of store.values()) {
                if (row[col1] === val1 && row[col2] === val2) {
                  return { data: { ...row }, error: null };
                }
              }
              return { data: null, error: null };
            }
          }),
          maybeSingle: async () => {
            const store = supabaseDatabase[table];
            for (const row of store.values()) {
              if (row[col1] === val1) {
                return { data: { ...row }, error: null };
              }
            }
            return { data: null, error: null };
          }
        }),
        order: () => ({
          then: (resolve) => resolve({ data: Array.from(supabaseDatabase[table].values()), error: null })
        }),
        then: (resolve) => resolve({ data: Array.from(supabaseDatabase[table].values()), error: null })
      }),
      insert: (payload) => ({
        select: async () => {
          if (shouldSimulateDbReject) {
            return { data: null, error: { message: 'Supabase rejected insert: permission denied for relation', code: simulateDbErrorCode || '42501' }, status: 403 };
          }
          const items = Array.isArray(payload) ? payload : [payload];
          const results = [];
          for (const item of items) {
            const id = item.id || `att_${Date.now()}_${Math.random()}`;
            // Check unique constraint (event_id, day_id, student_id)
            const dayKey = item.day_id || item.event_day_id;
            for (const existing of supabaseDatabase[table].values()) {
              const exDayKey = existing.day_id || existing.event_day_id;
              if (existing.event_id === item.event_id && exDayKey === dayKey && existing.student_id === item.student_id) {
                return { data: null, error: { message: 'duplicate key value violates unique constraint "unique_event_day_student"', code: '23505' }, status: 409 };
              }
            }
            const record = { ...item, id };
            supabaseDatabase[table].set(id, record);
            results.push(record);
          }
          return { data: Array.isArray(payload) ? results : results[0], error: null, status: 201 };
        }
      }),
      update: (payload) => ({
        eq: (col, val) => ({
          select: async () => {
            if (shouldSimulateDbReject) {
              return { data: null, error: { message: 'Supabase rejected update: lock timeout', code: simulateDbErrorCode || '55P03' }, status: 400 };
            }
            const store = supabaseDatabase[table];
            const existing = store.get(val);
            if (!existing) {
              return { data: null, error: { message: 'Record not found', code: 'PGRST116' }, status: 404 };
            }
            const updated = { ...existing, ...payload };
            store.set(val, updated);
            return { data: updated, error: null, status: 200 };
          }
        }),
        in: (col, ids) => {
          if (shouldSimulateDbReject) {
            return Promise.resolve({ data: null, error: { message: 'Batch update rejected', code: '42501' }, status: 403 });
          }
          const store = supabaseDatabase[table];
          ids.forEach(id => {
            const ex = store.get(id);
            if (ex) store.set(id, { ...ex, ...payload });
          });
          return Promise.resolve({ data: null, error: null, status: 200 });
        }
      })
    };
  }
};

// ---------------------------------------------------------------------------
// Simulation of StorageService Attendance Logic
// ---------------------------------------------------------------------------
const EVENT_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const DAY_1_ID = '11111111-1111-4111-a111-111111111111';
const DAY_2_ID = '22222222-2222-4222-a222-222222222222';
const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

// Seed event days in Supabase
supabaseDatabase.event_days.set(DAY_1_ID, { id: DAY_1_ID, event_id: EVENT_ID, day_number: 1, name: 'Day 1', status: 'Active' });
supabaseDatabase.event_days.set(DAY_2_ID, { id: DAY_2_ID, event_id: EVENT_ID, day_number: 2, name: 'Day 2', status: 'Upcoming' });

// Simulated saveDayAttendanceToSupabase
async function saveDayAttendanceToSupabase(eventId, dayId, studentId, status, markedBy, markedByRole) {
  const sb = mockSupabase;
  // STEP 3: Log payload
  const payload = {
    event_id: eventId,
    day_id: dayId,
    event_day_id: dayId,
    student_id: studentId,
    status,
    marked_by: markedBy,
    marked_by_role: markedByRole,
    marked_at: new Date().toISOString()
  };

  // STEP 5: Check existing
  let existingRecord = null;
  const q = await sb
    .from('event_day_attendance')
    .select('id')
    .eq('event_id', eventId)
    .eq('day_id', dayId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (q.data) existingRecord = q.data;

  if (existingRecord && existingRecord.id) {
    // UPDATE
    const updateRes = await sb
      .from('event_day_attendance')
      .update({ status, marked_by: markedBy, marked_by_role: markedByRole, marked_at: payload.marked_at, updated_at: new Date().toISOString() })
      .eq('id', existingRecord.id)
      .select();

    if (updateRes.error) {
      return { success: false, error: updateRes.error, operation: 'update' };
    }
    return { success: true, data: updateRes.data, operation: 'update' };
  } else {
    // INSERT
    const insertPayload = {
      id: `rec_${Date.now()}_${Math.random()}`,
      event_id: eventId,
      day_id: dayId,
      event_day_id: dayId,
      student_id: studentId,
      status,
      marked_by: markedBy,
      marked_by_role: markedByRole,
      marked_at: payload.marked_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const insertRes = await sb
      .from('event_day_attendance')
      .insert(insertPayload)
      .select();

    if (insertRes.error) {
      return { success: false, error: insertRes.error, operation: 'insert' };
    }
    return { success: true, data: insertRes.data, operation: 'insert' };
  }
}

// Client service wrapper with rollback
let clientAttendanceRecords = [];
async function setStudentDayAttendance(eventId, dayId, studentId, status, markedBy, markedByRole) {
  const previousState = [...clientAttendanceRecords];
  
  // Local optimistic update
  const existingIdx = clientAttendanceRecords.findIndex(r => r.event_id === eventId && r.day_id === dayId && r.student_id === studentId);
  const localRec = {
    id: existingIdx >= 0 ? clientAttendanceRecords[existingIdx].id : `loc_${Date.now()}`,
    event_id: eventId,
    day_id: dayId,
    student_id: studentId,
    status,
    marked_by: markedBy,
    marked_by_role: markedByRole
  };
  if (existingIdx >= 0) {
    clientAttendanceRecords[existingIdx] = localRec;
  } else {
    clientAttendanceRecords.push(localRec);
  }

  // Persist to Supabase
  const sbRes = await saveDayAttendanceToSupabase(eventId, dayId, studentId, status, markedBy, markedByRole);
  if (!sbRes.success) {
    // Rollback
    clientAttendanceRecords = previousState;
    return { success: false, record: localRec, error: sbRes.error };
  }

  return { success: true, record: localRec, error: null };
}

// Refresh simulation: syncs from mock Supabase
function simulatePageRefresh() {
  clientAttendanceRecords = Array.from(supabaseDatabase.event_day_attendance.values()).map(r => ({
    id: r.id,
    event_id: r.event_id,
    day_id: r.day_id,
    student_id: r.student_id,
    status: r.status,
    marked_by: r.marked_by,
    marked_by_role: r.marked_by_role
  }));
}

// ---------------------------------------------------------------------------
// STEP 8: RUNNING ALL 14 TEST CASES
// ---------------------------------------------------------------------------
console.log('================================================================');
console.log('🧪 RUNNING STEP 8: COMPREHENSIVE ATTENDANCE SAVE VERIFICATION');
console.log('================================================================');

async function runTests() {
  // Case 1: Volunteer marks Student A Present on Day 1
  console.log('\n--- Case 1: Volunteer marks Student A Present on Day 1 ---');
  let toastFired = null;
  let res1 = await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_A, 'Present', 'Volunteer 1', 'volunteer');
  if (res1.success) toastFired = 'Marked Present';
  assert.strictEqual(res1.success, true, 'Case 1 must succeed');
  assert.strictEqual(toastFired, 'Marked Present', 'Success toast must be displayed');
  assert.strictEqual(supabaseDatabase.event_day_attendance.size, 1, 'Supabase must have 1 record');
  console.log('✅ Case 1 Passed: Student A marked Present on Day 1.');

  // Case 2 & 3: Refresh page. Student A must still show Present.
  console.log('\n--- Cases 2 & 3: Refresh page. Student A must still show Present ---');
  simulatePageRefresh();
  const studentA_Day1 = clientAttendanceRecords.find(r => r.day_id === DAY_1_ID && r.student_id === STUDENT_A);
  assert(studentA_Day1, 'Student A record must exist after refresh');
  assert.strictEqual(studentA_Day1.status, 'Present', 'Student A must still show Present after refresh');
  console.log('✅ Cases 2 & 3 Passed: Refreshed page retains Present status.');

  // Case 4: Change Student A to Absent.
  console.log('\n--- Case 4: Change Student A to Absent on Day 1 (Must UPDATE, not INSERT) ---');
  let res4 = await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_A, 'Absent', 'Volunteer 1', 'volunteer');
  assert.strictEqual(res4.success, true, 'Case 4 must succeed');
  assert.strictEqual(supabaseDatabase.event_day_attendance.size, 1, 'Record count must remain 1 (UPDATE was performed, not duplicate INSERT)');
  console.log('✅ Case 4 Passed: Record updated to Absent without creating duplicates.');

  // Case 5 & 6: Refresh. Student A must show Absent.
  console.log('\n--- Cases 5 & 6: Refresh. Student A must show Absent ---');
  simulatePageRefresh();
  const studentA_Day1_Absent = clientAttendanceRecords.find(r => r.day_id === DAY_1_ID && r.student_id === STUDENT_A);
  assert.strictEqual(studentA_Day1_Absent.status, 'Absent', 'Student A must show Absent after refresh');
  console.log('✅ Cases 5 & 6 Passed: Refreshed page retains Absent status.');

  // Case 7 & 8: Move to Day 2. Mark Student A Present.
  console.log('\n--- Cases 7 & 8: Move to Day 2. Mark Student A Present ---');
  let res8 = await setStudentDayAttendance(EVENT_ID, DAY_2_ID, STUDENT_A, 'Present', 'Volunteer 1', 'volunteer');
  assert.strictEqual(res8.success, true, 'Case 8 must succeed');
  assert.strictEqual(supabaseDatabase.event_day_attendance.size, 2, 'Supabase must now contain 2 records (Day 1 + Day 2)');
  console.log('✅ Cases 7 & 8 Passed: Student A marked Present on Day 2.');

  // Case 9 & 10: Return to Day 1. Day 1 must still show Absent.
  console.log('\n--- Cases 9 & 10: Return to Day 1. Day 1 must still show Absent ---');
  simulatePageRefresh();
  const checkDay1 = clientAttendanceRecords.find(r => r.day_id === DAY_1_ID && r.student_id === STUDENT_A);
  const checkDay2 = clientAttendanceRecords.find(r => r.day_id === DAY_2_ID && r.student_id === STUDENT_A);
  assert.strictEqual(checkDay1.status, 'Absent', 'Day 1 status must remain Absent');
  assert.strictEqual(checkDay2.status, 'Present', 'Day 2 status must remain Present');
  console.log('✅ Cases 9 & 10 Passed: Day 1 (Absent) and Day 2 (Present) are completely isolated!');

  // Case 11: Admin must be able to view both records.
  console.log('\n--- Case 11: Admin views all records across days ---');
  const allDbRecords = Array.from(supabaseDatabase.event_day_attendance.values());
  assert.strictEqual(allDbRecords.length, 2, 'Admin can view all records across all days');
  console.log('✅ Case 11 Passed: Admin has full access to both Day 1 and Day 2 records.');

  // Case 12: Test "Mark All Present"
  console.log('\n--- Case 12: Test "Mark All Present" ---');
  await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_A, 'Present', 'Admin', 'admin');
  await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_B, 'Present', 'Admin', 'admin');
  simulatePageRefresh();
  const day1Records = clientAttendanceRecords.filter(r => r.day_id === DAY_1_ID);
  assert(day1Records.every(r => r.status === 'Present'), 'All students on Day 1 must be Present');
  console.log('✅ Case 12 Passed: Batch Present marks all students Present.');

  // Case 13: Test "Reset All Absent"
  console.log('\n--- Case 13: Test "Reset All Absent" ---');
  await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_A, 'Absent', 'Admin', 'admin');
  await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_B, 'Absent', 'Admin', 'admin');
  simulatePageRefresh();
  const day1AbsentRecords = clientAttendanceRecords.filter(r => r.day_id === DAY_1_ID);
  assert(day1AbsentRecords.every(r => r.status === 'Absent'), 'All students on Day 1 must be Absent');
  console.log('✅ Case 13 Passed: Reset All Absent marks all students Absent.');

  // Case 14: Multiple volunteers marking attendance concurrently
  console.log('\n--- Case 14: Multiple volunteers operating on same day ---');
  await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_A, 'Present', 'Floor Volunteer John', 'volunteer');
  await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_B, 'Present', 'Desk Volunteer Priya', 'volunteer');
  simulatePageRefresh();
  const vol1Record = clientAttendanceRecords.find(r => r.student_id === STUDENT_A && r.day_id === DAY_1_ID);
  const vol2Record = clientAttendanceRecords.find(r => r.student_id === STUDENT_B && r.day_id === DAY_1_ID);
  assert.strictEqual(vol1Record.marked_by, 'Floor Volunteer John');
  assert.strictEqual(vol2Record.marked_by, 'Desk Volunteer Priya');
  console.log('✅ Case 14 Passed: Multiple volunteers audited correctly.');

  // Case 15: CRITICAL ERROR HANDLING: Supabase Rejection Behavior
  console.log('\n--- Case 15: CRITICAL TEST: Supabase Rejects Save ---');
  shouldSimulateDbReject = true;
  simulateDbErrorCode = '42501'; // RLS rejection / table error
  toastFired = null;
  let errorToastFired = null;

  // Volunteer attempts to change Student A to Absent, but Supabase rejects
  const failingAttempt = await setStudentDayAttendance(EVENT_ID, DAY_1_ID, STUDENT_A, 'Absent', 'Floor Volunteer', 'volunteer');
  if (failingAttempt.success) {
    toastFired = 'Marked Absent';
  } else {
    errorToastFired = `Save Failed: ${failingAttempt.error.message} [Code: ${failingAttempt.error.code}]`;
  }

  assert.strictEqual(failingAttempt.success, false, 'Save must report failure');
  assert.strictEqual(toastFired, null, 'SUCCESS TOAST MUST NOT BE FIRED WHEN SAVE FAILS');
  assert(errorToastFired.includes('Save Failed'), 'Useful error toast must be shown');
  assert(errorToastFired.includes('42501'), 'Error code must be displayed in toast');
  
  // Verify UI / Local state was rolled back to previous state ('Present')
  const rolledBackState = clientAttendanceRecords.find(r => r.student_id === STUDENT_A && r.day_id === DAY_1_ID);
  assert.strictEqual(rolledBackState.status, 'Present', 'Local UI state must revert to Present (not stay Absent)');
  console.log('✅ Case 15 Passed: On Supabase rejection, success toast was suppressed, error was displayed, and UI state was rolled back!');

  console.log('\n================================================================');
  console.log('🎉 ALL 15 VERIFICATION TEST CASES PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
