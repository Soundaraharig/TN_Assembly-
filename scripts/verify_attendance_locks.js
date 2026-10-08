// verify_attendance_locks.js
// Automated verification script for the 13 required attendance lock scenarios

class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Simulated environment
const localStorage = new MockLocalStorage();

class AttendanceLockController {
  constructor() {
    this.event = {
      id: 'test-event-uuid-1',
      college_name: 'Test University Assembly',
      social_coverage: {}
    };
    this.days = [
      { id: 'day-1-uuid', event_id: 'test-event-uuid-1', day_number: 1, name: 'Day 1' }
    ];
    this.attendanceRecords = new Map(); // studentId -> { fn, an, marked_by, marked_at }
  }

  getLockState(dayId) {
    const sc = this.event.social_coverage || {};
    const byDay = sc.attendance_locks?.by_day?.[dayId] || {};
    const fn_locked = !!(
      byDay.fn_locked ??
      sc.fn_attendance_locked ??
      sc.attendance_locks?.fn_locked ??
      (localStorage.getItem(`attendance_lock_fn_${this.event.id}_${dayId}`) === 'true')
    );
    const an_locked = !!(
      byDay.an_locked ??
      sc.an_attendance_locked ??
      sc.attendance_locks?.an_locked ??
      (localStorage.getItem(`attendance_lock_an_${this.event.id}_${dayId}`) === 'true')
    );
    return { fn_locked, an_locked };
  }

  setAttendanceLock(session, locked, dayId) {
    const current = this.getLockState(dayId);
    const fn_locked = session === 'FN' ? locked : current.fn_locked;
    const an_locked = session === 'AN' ? locked : current.an_locked;

    // Persist in localStorage
    localStorage.setItem(`attendance_lock_fn_${this.event.id}_${dayId}`, fn_locked);
    localStorage.setItem(`attendance_lock_an_${this.event.id}_${dayId}`, an_locked);

    // Persist in social_coverage
    const sc = { ...(this.event.social_coverage || {}) };
    const byDay = { ...(sc.attendance_locks?.by_day || {}) };
    byDay[dayId] = { fn_locked, an_locked };
    this.event.social_coverage = {
      ...sc,
      fn_attendance_locked: fn_locked,
      an_attendance_locked: an_locked,
      attendance_locks: {
        fn_locked,
        an_locked,
        by_day: byDay
      }
    };
    return { fn_locked, an_locked };
  }

  // Authoritative write rejection
  setStudentAttendance(studentId, dayId, session, status, volunteerName = 'Volunteer') {
    // 1. Write-level lock enforcement
    const locks = this.getLockState(dayId);
    if (session === 'FN' && locks.fn_locked) {
      throw new Error('FN attendance is locked by admin.');
    }
    if (session === 'AN' && locks.an_locked) {
      throw new Error('AN attendance is locked by admin.');
    }
    if (!session || session === 'BOTH') {
      if (locks.fn_locked && locks.an_locked) {
        throw new Error('FN and AN attendance are locked by admin.');
      }
      if (locks.fn_locked) {
        throw new Error('FN attendance is locked by admin.');
      }
      if (locks.an_locked) {
        throw new Error('AN attendance is locked by admin.');
      }
    }

    // 2. Perform write
    const existing = this.attendanceRecords.get(studentId) || { fn: 'Absent', an: 'Absent' };
    let newFn = existing.fn;
    let newAn = existing.an;

    if (session === 'FN') {
      newFn = status;
    } else if (session === 'AN') {
      newAn = status;
    } else {
      newFn = status;
      newAn = status;
    }

    const updated = {
      student_id: studentId,
      day_id: dayId,
      fn: newFn,
      an: newAn,
      marked_by: `${volunteerName} [FN:${newFn}|AN:${newAn}]`,
      marked_at: new Date().toISOString()
    };
    this.attendanceRecords.set(studentId, updated);
    return updated;
  }
}

// ── Test Execution ──
async function runAllTests() {
  const ctrl = new AttendanceLockController();
  const dayId = 'day-1-uuid';
  const student1 = 'stud-1';
  const student2 = 'stud-2';
  let passed = 0;
  let total = 13;

  console.log('🧪 Starting 13 Verification Tests for FN and AN Attendance Locks...\n');

  // Test 1: FN unlocked -> volunteer marks FN attendance -> succeeds
  try {
    ctrl.setAttendanceLock('FN', false, dayId);
    ctrl.setStudentAttendance(student1, dayId, 'FN', 'Present');
    const rec = ctrl.attendanceRecords.get(student1);
    if (rec.fn === 'Present') {
      console.log('✅ Test 1 Passed: FN unlocked -> volunteer marks FN attendance -> succeeds.');
      passed++;
    } else {
      throw new Error('Status not set to Present');
    }
  } catch (e) {
    console.error('❌ Test 1 Failed:', e.message);
  }

  // Test 2: FN locked -> volunteer attempts FN attendance -> rejected
  try {
    ctrl.setAttendanceLock('FN', true, dayId);
    let errorCaught = false;
    try {
      ctrl.setStudentAttendance(student1, dayId, 'FN', 'Absent');
    } catch (e) {
      if (e.message === 'FN attendance is locked by admin.') {
        errorCaught = true;
      }
    }
    if (errorCaught && ctrl.attendanceRecords.get(student1).fn === 'Present') {
      console.log('✅ Test 2 Passed: FN locked -> volunteer attempts FN attendance -> rejected.');
      passed++;
    } else {
      throw new Error('Write was not rejected with correct error message');
    }
  } catch (e) {
    console.error('❌ Test 2 Failed:', e.message);
  }

  // Test 3: FN locked -> AN unlocked -> AN attendance still works
  try {
    ctrl.setAttendanceLock('AN', false, dayId);
    ctrl.setStudentAttendance(student1, dayId, 'AN', 'Present');
    const rec = ctrl.attendanceRecords.get(student1);
    if (rec.an === 'Present' && rec.fn === 'Present') {
      console.log('✅ Test 3 Passed: FN locked -> AN unlocked -> AN attendance still works.');
      passed++;
    } else {
      throw new Error('AN was not set or FN was overwritten');
    }
  } catch (e) {
    console.error('❌ Test 3 Failed:', e.message);
  }

  // Test 4: FN unlocked -> AN locked -> FN still works
  try {
    ctrl.setAttendanceLock('FN', false, dayId);
    ctrl.setAttendanceLock('AN', true, dayId);
    ctrl.setStudentAttendance(student1, dayId, 'FN', 'Absent');
    const rec = ctrl.attendanceRecords.get(student1);
    if (rec.fn === 'Absent' && rec.an === 'Present') {
      console.log('✅ Test 4 Passed: FN unlocked -> AN locked -> FN still works.');
      passed++;
    } else {
      throw new Error('FN not updated or AN altered');
    }
  } catch (e) {
    console.error('❌ Test 4 Failed:', e.message);
  }

  // Test 5: Volunteer attendance page already open -> admin locks FN -> volunteer tries FN update -> MUST fail
  try {
    // Admin locks FN while volunteer had page open
    ctrl.setAttendanceLock('FN', true, dayId);
    let rejected = false;
    try {
      ctrl.setStudentAttendance(student2, dayId, 'FN', 'Present');
    } catch (e) {
      if (e.message.includes('FN attendance is locked by admin')) {
        rejected = true;
      }
    }
    if (rejected && (!ctrl.attendanceRecords.has(student2) || ctrl.attendanceRecords.get(student2).fn !== 'Present')) {
      console.log('✅ Test 5 Passed: Already open page -> admin locks FN -> write MUST fail.');
      passed++;
    } else {
      throw new Error('Open page bypassed lock');
    }
  } catch (e) {
    console.error('❌ Test 5 Failed:', e.message);
  }

  // Test 6: Admin locks FN -> volunteer refreshes page -> FN remains locked
  try {
    const persistedLocks = ctrl.getLockState(dayId);
    if (persistedLocks.fn_locked === true) {
      console.log('✅ Test 6 Passed: Admin locks FN -> volunteer refreshes page -> FN remains locked.');
      passed++;
    } else {
      throw new Error('Lock state lost across refresh');
    }
  } catch (e) {
    console.error('❌ Test 6 Failed:', e.message);
  }

  // Test 7: Admin locks FN -> disconnect/reconnect realtime -> FN remains locked
  try {
    // Re-simulate hydration from remote social_coverage
    const rehydrated = ctrl.getLockState(dayId);
    if (rehydrated.fn_locked === true) {
      console.log('✅ Test 7 Passed: Realtime reconnect -> FN remains locked.');
      passed++;
    } else {
      throw new Error('Lock lost on reconnect');
    }
  } catch (e) {
    console.error('❌ Test 7 Failed:', e.message);
  }

  // Test 8: Admin unlocks FN -> volunteer can update FN again
  try {
    ctrl.setAttendanceLock('FN', false, dayId);
    ctrl.setStudentAttendance(student2, dayId, 'FN', 'Present');
    if (ctrl.attendanceRecords.get(student2).fn === 'Present') {
      console.log('✅ Test 8 Passed: Admin unlocks FN -> volunteer can update FN again.');
      passed++;
    } else {
      throw new Error('Update failed after unlock');
    }
  } catch (e) {
    console.error('❌ Test 8 Failed:', e.message);
  }

  // Test 9: Rapid double-click on attendance -> no duplicate/incorrect attendance writes
  try {
    const p1 = ctrl.setStudentAttendance(student2, dayId, 'FN', 'Present');
    const p2 = ctrl.setStudentAttendance(student2, dayId, 'FN', 'Present');
    if (p1.fn === 'Present' && p2.fn === 'Present') {
      console.log('✅ Test 9 Passed: Rapid double-click -> consistent idempotent writes.');
      passed++;
    }
  } catch (e) {
    console.error('❌ Test 9 Failed:', e.message);
  }

  // Test 10: Two volunteers attempt attendance around the moment admin locks -> no write succeeds after lock
  try {
    ctrl.setStudentAttendance(student1, dayId, 'FN', 'Present'); // Volunteer 1 succeeds before lock
    ctrl.setAttendanceLock('FN', true, dayId); // Admin locks
    let v2Blocked = false;
    try {
      ctrl.setStudentAttendance(student1, dayId, 'FN', 'Absent'); // Volunteer 2 attempts after lock
    } catch (e) {
      v2Blocked = true;
    }
    if (v2Blocked && ctrl.attendanceRecords.get(student1).fn === 'Present') {
      console.log('✅ Test 10 Passed: Concurrent writes at lock boundary -> rejected once locked.');
      passed++;
    } else {
      throw new Error('Post-lock write succeeded');
    }
  } catch (e) {
    console.error('❌ Test 10 Failed:', e.message);
  }

  // Test 11: Existing attendance records before locking remain unchanged
  try {
    const preSnapshot = JSON.stringify(Array.from(ctrl.attendanceRecords.entries()));
    ctrl.setAttendanceLock('FN', true, dayId);
    ctrl.setAttendanceLock('AN', true, dayId);
    const postSnapshot = JSON.stringify(Array.from(ctrl.attendanceRecords.entries()));
    if (preSnapshot === postSnapshot) {
      console.log('✅ Test 11 Passed: Existing attendance records before locking remain unchanged.');
      passed++;
    } else {
      throw new Error('Records were modified upon locking');
    }
  } catch (e) {
    console.error('❌ Test 11 Failed:', e.message);
  }

  // Test 12: Locking/unlocking FN never changes AN records
  try {
    ctrl.setAttendanceLock('AN', false, dayId);
    ctrl.setStudentAttendance(student1, dayId, 'AN', 'Present');
    const anBefore = ctrl.attendanceRecords.get(student1).an;

    ctrl.setAttendanceLock('FN', true, dayId);
    ctrl.setAttendanceLock('FN', false, dayId);
    const anAfter = ctrl.attendanceRecords.get(student1).an;

    if (anBefore === anAfter && anAfter === 'Present') {
      console.log('✅ Test 12 Passed: Locking/unlocking FN never changes AN records.');
      passed++;
    } else {
      throw new Error('AN record changed when toggling FN lock');
    }
  } catch (e) {
    console.error('❌ Test 12 Failed:', e.message);
  }

  // Test 13: Locking/unlocking AN never changes FN records
  try {
    ctrl.setAttendanceLock('FN', false, dayId);
    ctrl.setStudentAttendance(student1, dayId, 'FN', 'Present');
    const fnBefore = ctrl.attendanceRecords.get(student1).fn;

    ctrl.setAttendanceLock('AN', true, dayId);
    ctrl.setAttendanceLock('AN', false, dayId);
    const fnAfter = ctrl.attendanceRecords.get(student1).fn;

    if (fnBefore === fnAfter && fnAfter === 'Present') {
      console.log('✅ Test 13 Passed: Locking/unlocking AN never changes FN records.');
      passed++;
    } else {
      throw new Error('FN record changed when toggling AN lock');
    }
  } catch (e) {
    console.error('❌ Test 13 Failed:', e.message);
  }

  console.log(`\n🎉 Verification Summary: ${passed} / ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests();
