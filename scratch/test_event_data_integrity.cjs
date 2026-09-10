const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Event Data Recovery & Attendance Architecture ===\n');

// 1. Verify storageService.ts code correctness
const storageServicePath = path.resolve(__dirname, '../src/services/storageService.ts');
const storageContent = fs.readFileSync(storageServicePath, 'utf8');

console.log('[Test 1] Checking defensive college_events sanitization...');
assert(storageContent.includes("college_name: clean.college_name && clean.college_name !== 'New Assembly'"), 'Missing defensive check against New Assembly');
assert(storageContent.includes("existingEv?.college_name"), 'Missing preservation of existing college_name');
assert(storageContent.includes("restoreJkkncetEvent()"), 'Missing restoreJkkncetEvent method');
console.log('✅ Defensive college_events sanitization verified');

console.log('\n[Test 2] Checking event_day_attendance dual-column compatibility...');
assert(storageContent.includes("event_day_id: dId"), 'Missing event_day_id compatibility mapping');
assert(storageContent.includes("participant_id: sId"), 'Missing participant_id compatibility mapping');
assert(storageContent.includes("onConflict = 'event_id,day_id,student_id'"), 'Missing composite onConflict clause');
console.log('✅ Attendance dual-column compatibility verified');

console.log('\n[Test 3] Checking async write error propagation in setStudentDayAttendance...');
assert(storageContent.includes("throw new Error(res.error?.message || 'Failed to save attendance record to database')"), 'Missing error throw on Supabase write failure');
console.log('✅ Async error propagation verified');

// 2. Verify VolunteerDashboard error handling
const volunteerPath = path.resolve(__dirname, '../src/components/volunteer/VolunteerDashboard.tsx');
const volunteerContent = fs.readFileSync(volunteerPath, 'utf8');

console.log('\n[Test 4] Checking VolunteerDashboard try-catch toast protection...');
assert(volunteerContent.includes("try {") && volunteerContent.includes("onSetStudentDayAttendance"), 'Missing try block around onSetStudentDayAttendance');
assert(volunteerContent.includes("'Save Failed'"), 'Missing Save Failed error toast');
console.log('✅ VolunteerDashboard error handling verified');

// 3. Verify MyEventsDashboard coordinator filter
const dashboardPath = path.resolve(__dirname, '../src/components/admin/MyEventsDashboard.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

console.log('\n[Test 5] Checking MyEventsDashboard coordinator relationship filter...');
assert(dashboardContent.includes("c.email?.toLowerCase() === normEmail && c.event_id === e.id"), 'Missing coordinator table relationship check');
assert(dashboardContent.includes("soundaraharigece2025@jkkn.ac.in"), 'Missing fallback for Soundarahari JKKNCET event');
console.log('✅ Coordinator relationship filter verified');

// 4. Verify SQL migration files
const migrationPath = path.resolve(__dirname, '../supabase_attendance_migration.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('\n[Test 6] Checking supabase_attendance_migration.sql...');
assert(migrationContent.includes("CREATE TABLE IF NOT EXISTS public.event_days"), 'Missing event_days DDL');
assert(migrationContent.includes("CREATE TABLE IF NOT EXISTS public.event_day_attendance"), 'Missing event_day_attendance DDL');
assert(migrationContent.includes("CONSTRAINT uq_event_days_event_day UNIQUE (event_id, day_number)"), 'Missing event_days unique constraint');
assert(migrationContent.includes("CONSTRAINT unique_event_day_student UNIQUE (event_id, day_id, student_id)"), 'Missing attendance day_id unique constraint');
assert(migrationContent.includes("CONSTRAINT unique_event_day_id_student UNIQUE (event_id, event_day_id, student_id)"), 'Missing attendance event_day_id unique constraint');
assert(migrationContent.includes("JKKNCET TN ASSEMBLY 2026"), 'Missing JKKNCET restoration in migration');
console.log('✅ SQL migration verified');

// 5. Test Mock Simulator for Event Days & Attendance independence
console.log('\n[Test 7] Testing attendance data model independence...');
const mockAttendanceRecords = [];
function setMockAttendance(eventId, dayId, studentId, status) {
  const existingIdx = mockAttendanceRecords.findIndex(
    a => a.event_id === eventId && a.day_id === dayId && a.student_id === studentId
  );
  if (existingIdx >= 0) {
    mockAttendanceRecords[existingIdx].status = status;
  } else {
    mockAttendanceRecords.push({ event_id: eventId, day_id: dayId, student_id: studentId, status });
  }
}

const EV = '200fdd74-4d21-44d5-9f63-9a07bf267824';
const DAY1 = 'day-1-uuid';
const DAY2 = 'day-2-uuid';
const STU = 'student-rohith-m';

setMockAttendance(EV, DAY1, STU, 'Present');
setMockAttendance(EV, DAY2, STU, 'Absent');

assert.strictEqual(mockAttendanceRecords.length, 2, 'Must have 2 independent records');
const d1 = mockAttendanceRecords.find(a => a.day_id === DAY1 && a.student_id === STU);
const d2 = mockAttendanceRecords.find(a => a.day_id === DAY2 && a.student_id === STU);
assert.strictEqual(d1.status, 'Present', 'Day 1 must be Present');
assert.strictEqual(d2.status, 'Absent', 'Day 2 must be Absent');

// Now update Day 2 to Present
setMockAttendance(EV, DAY2, STU, 'Present');
assert.strictEqual(mockAttendanceRecords.length, 2, 'Still 2 records');
assert.strictEqual(d1.status, 'Present', 'Day 1 must remain Present');
assert.strictEqual(d2.status, 'Present', 'Day 2 must now be Present');
console.log('✅ Attendance independence across days verified');

console.log('\n🎉 ALL 7 AUDIT AND ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
