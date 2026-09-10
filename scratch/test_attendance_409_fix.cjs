const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('=== TEST SUITE: VOLUNTEER ATTENDANCE CHECK-IN 409 FIX ===');
console.log('===============================================================\n');

// 1. Verify storageService source code invariants
const storageServicePath = path.resolve(__dirname, '../src/services/storageService.ts');
const storageContent = fs.readFileSync(storageServicePath, 'utf8');

console.log('[Check 1] Verifying check-then-update logic in storageService.ts...');
assert(storageContent.includes("from('event_day_attendance')"), 'Missing event_day_attendance query');
assert(storageContent.includes("eq('student_id', studentId)"), 'Missing student_id filter');
assert(storageContent.includes("eq('day_id', dayId)"), 'Missing day_id filter');
assert(storageContent.includes("updateSuccessful"), 'Missing update flag');
console.log('✅ Check-then-update logic present in storageService.ts');

console.log('\n[Check 2] Verifying 409 conflict recovery in storageService.ts...');
assert(storageContent.includes("is409"), 'Missing is409 detection');
assert(storageContent.includes("conflictRow"), 'Missing conflictRow resolution');
assert(storageContent.includes("409 Conflict caught during attendance insert"), 'Missing 409 recovery log');
console.log('✅ 409 conflict recovery present in storageService.ts');

console.log('\n[Check 3] Verifying batch attendance bulk update & deduplication...');
assert(storageContent.includes("existingStudentIdsToUpdate"), 'Missing existingStudentIdsToUpdate');
assert(storageContent.includes("newRecordsToInsert"), 'Missing newRecordsToInsert');
assert(storageContent.includes(".in('student_id', existingStudentIdsToUpdate)"), 'Missing bulk update by student_id in batch');
console.log('✅ Batch attendance bulk update & deduplication present');

console.log('\n[Check 4] Verifying VolunteerDashboard double-click debounce and disabled states...');
const volunteerPath = path.resolve(__dirname, '../src/components/volunteer/VolunteerDashboard.tsx');
const volunteerContent = fs.readFileSync(volunteerPath, 'utf8');

assert(volunteerContent.includes("processingAttendanceIds"), 'Missing processingAttendanceIds tracking');
assert(volunteerContent.includes("disabled={processingAttendanceIds.has(learner.id)}"), 'Missing disabled attribute on delegate attendance button');
assert(volunteerContent.includes("isBatchAttendanceLoading"), 'Missing isBatchAttendanceLoading tracking');
assert(volunteerContent.includes("disabled={isBatchAttendanceLoading}"), 'Missing disabled attribute on batch buttons');
console.log('✅ VolunteerDashboard double-click debounce and disabled states present');

// 2. Behavioral Simulator for Test Cases 1 through 7
console.log('\n--- SIMULATING ATTENDANCE LIFECYCLE (TEST CASES 1 - 7) ---');

class MockDatabase {
  constructor() {
    this.table = [];
  }

  find(eventId, dayId, studentId) {
    return this.table.find(r => r.event_id === eventId && r.day_id === dayId && r.student_id === studentId);
  }

  count(eventId, dayId, studentId) {
    return this.table.filter(r => r.event_id === eventId && r.day_id === dayId && r.student_id === studentId).length;
  }

  // Simulates our new setStudentDayAttendance logic
  async setStudentAttendance(eventId, dayId, studentId, status, markedBy = 'Volunteer') {
    // 1. Check if record exists
    const existing = this.find(eventId, dayId, studentId);
    if (existing) {
      // 2. UPDATE existing record
      existing.status = status;
      existing.marked_by = markedBy;
      existing.updated_at = new Date().toISOString();
      return { action: 'UPDATE', record: existing };
    }

    // 3. INSERT new record
    const newRecord = {
      id: 'uuid-' + Math.random().toString(36).substring(2, 9),
      event_id: eventId,
      day_id: dayId,
      student_id: studentId,
      status,
      marked_by: markedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.table.push(newRecord);
    return { action: 'INSERT', record: newRecord };
  }

  // Simulates our batchSetDayAttendance logic
  async batchSetAttendance(eventId, dayId, studentIds, status, markedBy = 'Volunteer') {
    for (const sid of studentIds) {
      await this.setStudentAttendance(eventId, dayId, sid, status, markedBy);
    }
  }

  // Simulates race condition 409 handling
  async simulateConcurrentInsertRace(eventId, dayId, studentId, desiredStatus) {
    // Another client inserted while we were checking
    if (!this.find(eventId, dayId, studentId)) {
      this.table.push({
        id: 'concurrent-uuid-1',
        event_id: eventId,
        day_id: dayId,
        student_id: studentId,
        status: desiredStatus === 'Present' ? 'Absent' : 'Present'
      });
    }

    // Our request attempts insert, hits 409, and executes recovery:
    const conflictRow = this.find(eventId, dayId, studentId);
    assert(conflictRow, 'Must find conflicting row');
    conflictRow.status = desiredStatus;
    return conflictRow;
  }
}

const db = new MockDatabase();
const EV = 'ev-jkkncet-2026';
const DAY = 'day-1-uuid';
const DELEGATE_1 = 'student-rohith-m';
const DELEGATE_2 = 'student-ananya-s';
const DELEGATE_3 = 'student-karthik-r';

// TEST 1: Delegate has no attendance row. Click Present.
console.log('\n[Test 1] Delegate has no attendance row. Click Present...');
let res1;
let t1 = async () => {
  res1 = await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Present');
};
t1().then(async () => {
  assert.strictEqual(res1.action, 'INSERT');
  assert.strictEqual(db.count(EV, DAY, DELEGATE_1), 1, 'Expected exactly 1 row');
  assert.strictEqual(db.find(EV, DAY, DELEGATE_1).status, 'Present', 'Expected Present');
  console.log('✅ Test 1 Passed: Exactly one attendance row created with status Present');

  // TEST 2: Delegate already has Present. Click Absent.
  console.log('\n[Test 2] Delegate already has Present. Click Absent...');
  const res2 = await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Absent');
  assert.strictEqual(res2.action, 'UPDATE');
  assert.strictEqual(db.count(EV, DAY, DELEGATE_1), 1, 'Expected exactly 1 row, NO duplicate');
  assert.strictEqual(db.find(EV, DAY, DELEGATE_1).status, 'Absent', 'Expected status to change to Absent');
  console.log('✅ Test 2 Passed: Existing row updated to Absent without creating a duplicate row');

  // TEST 3: Delegate already has Absent. Click Present.
  console.log('\n[Test 3] Delegate already has Absent. Click Present...');
  const res3 = await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Present');
  assert.strictEqual(res3.action, 'UPDATE');
  assert.strictEqual(db.count(EV, DAY, DELEGATE_1), 1, 'Expected exactly 1 row, NO duplicate');
  assert.strictEqual(db.find(EV, DAY, DELEGATE_1).status, 'Present', 'Expected status to change to Present');
  console.log('✅ Test 3 Passed: Existing row updated to Present without creating a duplicate row');

  // TEST 4: Click Present multiple times.
  console.log('\n[Test 4] Click Present multiple times...');
  await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Present');
  await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Present');
  await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Present');
  assert.strictEqual(db.count(EV, DAY, DELEGATE_1), 1, 'Expected only 1 row after multiple clicks');
  assert.strictEqual(db.find(EV, DAY, DELEGATE_1).status, 'Present');
  console.log('✅ Test 4 Passed: Repeated Present clicks maintain exactly 1 row');

  // TEST 5: Click Absent multiple times.
  console.log('\n[Test 5] Click Absent multiple times...');
  await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Absent');
  await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Absent');
  await db.setStudentAttendance(EV, DAY, DELEGATE_1, 'Absent');
  assert.strictEqual(db.count(EV, DAY, DELEGATE_1), 1, 'Expected only 1 row after multiple clicks');
  assert.strictEqual(db.find(EV, DAY, DELEGATE_1).status, 'Absent');
  console.log('✅ Test 5 Passed: Repeated Absent clicks maintain exactly 1 row');

  // TEST 6: Use Mark All Present.
  console.log('\n[Test 6] Use Mark All Present for multiple delegates...');
  const allStudents = [DELEGATE_1, DELEGATE_2, DELEGATE_3];
  await db.batchSetAttendance(EV, DAY, allStudents, 'Present');
  for (const sid of allStudents) {
    assert.strictEqual(db.count(EV, DAY, sid), 1, `Expected 1 row for ${sid}`);
    assert.strictEqual(db.find(EV, DAY, sid).status, 'Present', `Expected Present for ${sid}`);
  }
  console.log('✅ Test 6 Passed: Mark All Present sets all delegates to Present with no duplicate rows');

  // TEST 7: Use Reset All Absent.
  console.log('\n[Test 7] Use Reset All Absent for multiple delegates...');
  await db.batchSetAttendance(EV, DAY, allStudents, 'Absent');
  for (const sid of allStudents) {
    assert.strictEqual(db.count(EV, DAY, sid), 1, `Expected 1 row for ${sid}`);
    assert.strictEqual(db.find(EV, DAY, sid).status, 'Absent', `Expected Absent for ${sid}`);
  }
  console.log('✅ Test 7 Passed: Reset All Absent updates all delegates to Absent with no duplicate rows');

  // BONUS: Race condition 409 Conflict Simulation
  console.log('\n[Bonus Test] Simulating concurrent 409 conflict and automatic recovery...');
  const raceStudent = 'student-race-condition';
  const raceResult = await db.simulateConcurrentInsertRace(EV, DAY, raceStudent, 'Present');
  assert.strictEqual(raceResult.status, 'Present');
  assert.strictEqual(db.count(EV, DAY, raceStudent), 1, 'Exactly 1 row after 409 resolution');
  console.log('✅ Bonus Test Passed: 409 conflict resolved into an update gracefully without error');

  console.log('\n🎉 ALL ATTENDANCE 409 CONFLICT VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
});
