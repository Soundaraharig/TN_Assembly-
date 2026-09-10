/**
 * Automated Verification Script:
 * 1. Clean demo event days & attendance while preserving all learners
 * 2. Uniqueness of event days (event_id, day_number)
 * 3. Independent day attendance records
 * 4. Canonical leadership role assignment & bench validation rules (CM ruling only, LOP opposition only)
 * 5. Single holder role demotion & unassignment
 * 6. Role filter matching
 */

const assert = require('assert');

// Mock localStorage for Node environment
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

global.localStorage = new MockLocalStorage();
global.window = {
  localStorage: global.localStorage
};

console.log('--- STARTING VERIFICATION TEST SUITE ---');

// Test 1: Bench validation logic
const CANONICAL_ROLES = {
  CHIEF_MINISTER: 'Chief Minister',
  SPEAKER: 'Assembly Speaker',
  LEADER_OF_OPPOSITION: 'Leader of Opposition'
};

function normalizeLeadershipRole(role) {
  if (!role) return '';
  const r = role.trim().toLowerCase();
  if (r.includes('chief minister') || r === 'cm' || r.includes('leader of the house')) {
    return CANONICAL_ROLES.CHIEF_MINISTER;
  }
  if (r.includes('speaker') && !r.includes('deputy')) {
    return CANONICAL_ROLES.SPEAKER;
  }
  if (r.includes('opposition') || r.includes('lop') || r.includes('shadow leader')) {
    return CANONICAL_ROLES.LEADER_OF_OPPOSITION;
  }
  return role.trim();
}

function isChiefMinisterRole(role) {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return r === 'chief minister' || r.includes('chief minister') || r.includes('leader of the house');
}

function isSpeakerRole(role) {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return (r === 'assembly speaker' || r === 'speaker' || r.includes('speaker of')) && !r.includes('deputy');
}

function isLeaderOfOppositionRole(role) {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return (
    r === 'leader of opposition' ||
    r === 'leader of the opposition' ||
    r === 'opposition leader' ||
    r.includes('leader of opposition') ||
    r.includes('leader of the opposition')
  );
}

function isAssemblyRoleMatching(currentRole, targetRole) {
  if (!currentRole || !targetRole) return false;
  if (isChiefMinisterRole(targetRole) && isChiefMinisterRole(currentRole)) return true;
  if (isSpeakerRole(targetRole) && isSpeakerRole(currentRole)) return true;
  if (isLeaderOfOppositionRole(targetRole) && isLeaderOfOppositionRole(currentRole)) return true;
  return currentRole.trim().toLowerCase() === targetRole.trim().toLowerCase();
}

function getResolvedLearnerBench(learner, parties = []) {
  if (learner.bench) return learner.bench;
  if (learner.party_id) {
    const found = parties.find(p => p.id === learner.party_id);
    if (found && found.bench) return found.bench;
  }
  if (learner.party_name) {
    const found = parties.find(p => p.name.toLowerCase() === learner.party_name.toLowerCase());
    if (found && found.bench) return found.bench;
  }
  return 'Independent';
}

console.log('Checking Role Normalization...');
assert.strictEqual(normalizeLeadershipRole('Chief Minister (Leader of the House)'), 'Chief Minister');
assert.strictEqual(normalizeLeadershipRole('Speaker of Legislative Assembly'), 'Assembly Speaker');
assert.strictEqual(normalizeLeadershipRole('Leader of the Opposition'), 'Leader of Opposition');
assert.strictEqual(isChiefMinisterRole('Chief Minister'), true);
assert.strictEqual(isSpeakerRole('Assembly Speaker'), true);
assert.strictEqual(isLeaderOfOppositionRole('Leader of Opposition'), true);
console.log('✓ Role normalization verified.');

// Test 2: In-memory simulation of StorageService methods
class StorageSimulator {
  constructor() {
    this.eventDays = [];
    this.dayAttendance = [];
    this.learners = [];
    this.parties = [];
    this.events = [];
  }

  cleanDemoEventDaysAndAttendance() {
    const isTargetEvent = (id) => {
      const clean = (id || '').toLowerCase().trim();
      return clean.includes('jkkncet') || clean.includes('jkkn') || clean.includes('assembly-2026');
    };

    const initialDays = this.eventDays.length;
    this.eventDays = this.eventDays.filter(d => !isTargetEvent(d.event_id));
    this.dayAttendance = this.dayAttendance.filter(a => !isTargetEvent(a.event_id));
    return { cleanedDays: initialDays - this.eventDays.length };
  }

  getEventDays(eventId) {
    return this.eventDays.filter(d => d.event_id === eventId);
  }

  addEventDay(day) {
    const existing = this.eventDays.find(
      d => d.event_id === day.event_id && Number(d.day_number) === Number(day.day_number)
    );
    if (existing) {
      throw new Error(`Day ${day.day_number} already exists for this event (${existing.name}). Duplicate day numbers are prohibited.`);
    }
    const newDay = {
      id: day.id || 'day_' + Math.random().toString(36).substring(2, 8),
      activities: [],
      ...day
    };
    this.eventDays.push(newDay);
    return newDay;
  }

  setStudentDayAttendance(eventId, dayId, studentId, status) {
    let rec = this.dayAttendance.find(a => a.event_id === eventId && a.day_id === dayId && a.student_id === studentId);
    if (rec) {
      rec.status = status;
      rec.marked_at = new Date().toISOString();
    } else {
      rec = {
        id: 'att_' + Math.random().toString(36).substring(2, 8),
        event_id: eventId,
        day_id: dayId,
        student_id: studentId,
        status,
        marked_at: new Date().toISOString()
      };
      this.dayAttendance.push(rec);
    }
    return rec;
  }

  assignCabinetRole(eventId, learnerId, portfolioRole) {
    if (!eventId || !portfolioRole) {
      return { success: false, message: 'Event ID and role are required', learners: this.learners.filter(l => l.event_id === eventId) };
    }

    const canonicalRole = normalizeLeadershipRole(portfolioRole);
    let targetLearner;
    if (learnerId && learnerId.trim()) {
      targetLearner = this.learners.find(l => l.event_id === eventId && (l.id === learnerId || l.access_code === learnerId));
      if (!targetLearner) {
        return { success: false, message: 'Participant not found in roster', learners: this.learners.filter(l => l.event_id === eventId) };
      }

      const bench = getResolvedLearnerBench(targetLearner, this.parties);

      if (isChiefMinisterRole(canonicalRole)) {
        if (bench === 'Opposition') {
          return {
            success: false,
            message: 'Chief Minister must belong to the Ruling party / bench (Opposition delegates cannot be appointed CM)',
            learners: this.learners.filter(l => l.event_id === eventId)
          };
        }
      } else if (isLeaderOfOppositionRole(canonicalRole)) {
        if (bench === 'Ruling') {
          return {
            success: false,
            message: 'Leader of Opposition must belong to the Opposition party / bench (Ruling delegates cannot be appointed LOP)',
            learners: this.learners.filter(l => l.event_id === eventId)
          };
        }
      }
    }

    const isMatchingRole = (r) => isAssemblyRoleMatching(r, canonicalRole);

    this.learners = this.learners.map(l => {
      if (l.event_id === eventId) {
        if (targetLearner && l.id === targetLearner.id) {
          return { ...l, role: canonicalRole };
        }
        if (isMatchingRole(l.role) && (!targetLearner || l.id !== targetLearner.id)) {
          return { ...l, role: 'Member of Legislative Assembly (MLA)' };
        }
      }
      return l;
    });

    return { success: true, learners: this.learners.filter(l => l.event_id === eventId) };
  }
}

const sim = new StorageSimulator();
const EVENT_ID = 'jkkncet-tn-assembly-2026';

// Seed mock duplicate days (simulating the 12 duplicate cards bug)
sim.eventDays = [
  { id: 'd1_1', event_id: EVENT_ID, day_number: 1, name: 'Day 1' },
  { id: 'd1_2', event_id: EVENT_ID, day_number: 1, name: 'Day 1' },
  { id: 'd2_1', event_id: EVENT_ID, day_number: 2, name: 'Day 2' },
  { id: 'd2_2', event_id: EVENT_ID, day_number: 2, name: 'Day 2' },
  { id: 'd3_1', event_id: EVENT_ID, day_number: 3, name: 'Day 3' },
  { id: 'd3_2', event_id: EVENT_ID, day_number: 3, name: 'Day 3' }
];

sim.dayAttendance = [
  { id: 'a1', event_id: EVENT_ID, day_id: 'd1_1', student_id: 's1', status: 'Present' },
  { id: 'a2', event_id: EVENT_ID, day_id: 'd2_1', student_id: 's1', status: 'Present' }
];

// Seed genuine participants
sim.learners = [
  { id: 's1', event_id: EVENT_ID, full_name: 'Soundar (Ruling)', bench: 'Ruling', role: 'Member of Legislative Assembly (MLA)', access_code: 'TNA001' },
  { id: 's2', event_id: EVENT_ID, full_name: 'Arun (Opposition)', bench: 'Opposition', role: 'Member of Legislative Assembly (MLA)', access_code: 'TNA002' },
  { id: 's3', event_id: EVENT_ID, full_name: 'Priya (Ruling)', bench: 'Ruling', role: 'Member of Legislative Assembly (MLA)', access_code: 'TNA003' },
  { id: 's4', event_id: EVENT_ID, full_name: 'Karthik (Independent)', bench: 'Independent', role: 'Member of Legislative Assembly (MLA)', access_code: 'TNA004' }
];

sim.parties = [
  { id: 'p1', event_id: EVENT_ID, name: 'Ruling Democratic Front', bench: 'Ruling' },
  { id: 'p2', event_id: EVENT_ID, name: 'United Opposition Front', bench: 'Opposition' }
];

console.log('Testing Clean Demo Data...');
const cleanRes = sim.cleanDemoEventDaysAndAttendance();
assert.strictEqual(cleanRes.cleanedDays, 6);
assert.strictEqual(sim.getEventDays(EVENT_ID).length, 0, 'Configured days must be 0 after cleanup');
assert.strictEqual(sim.dayAttendance.length, 0, 'Attendance must be 0 after cleanup');
assert.strictEqual(sim.learners.length, 4, 'Real learners must NEVER be deleted');
console.log('✓ Clean Demo Data passed. Days count is exactly 0, all 4 learners preserved.');

console.log('Testing Manual Day Creation without Auto-Seeding...');
const day1 = sim.addEventDay({ event_id: EVENT_ID, day_number: 1, name: 'Day 1' });
assert.strictEqual(day1.day_number, 1);
assert.deepStrictEqual(day1.activities, [], 'New day must not have auto-seeded activities');
console.log('✓ Manual Day 1 created with 0 auto-seeded activities.');

console.log('Testing Duplicate Day Number Prevention...');
let duplicateRejected = false;
try {
  sim.addEventDay({ event_id: EVENT_ID, day_number: 1, name: 'Day 1 Duplicate' });
} catch (e) {
  duplicateRejected = true;
  console.log('Caught expected error:', e.message);
}
assert.strictEqual(duplicateRejected, true, 'Duplicate day_number must be rejected');
console.log('✓ Duplicate day number successfully rejected.');

const day2 = sim.addEventDay({ event_id: EVENT_ID, day_number: 2, name: 'Day 2' });
assert.strictEqual(sim.getEventDays(EVENT_ID).length, 2);
console.log('✓ Day 2 created cleanly.');

console.log('Testing Independent Day Attendance...');
sim.setStudentDayAttendance(EVENT_ID, day1.id, 's1', 'Present');
const day1Att = sim.dayAttendance.filter(a => a.day_id === day1.id);
const day2Att = sim.dayAttendance.filter(a => a.day_id === day2.id);
assert.strictEqual(day1Att.length, 1);
assert.strictEqual(day2Att.length, 0, 'Day 2 attendance must remain completely independent');
console.log('✓ Day 1 and Day 2 attendance are fully isolated.');

console.log('Testing Leadership Role Assignment & Bench Rules...');
// 1. Assign CM to Opposition (should fail)
const cmOppositionRes = sim.assignCabinetRole(EVENT_ID, 's2', 'Chief Minister');
assert.strictEqual(cmOppositionRes.success, false);
console.log('Opposition for CM rejected:', cmOppositionRes.message);

// 2. Assign CM to Ruling (should succeed)
const cmRulingRes = sim.assignCabinetRole(EVENT_ID, 's1', 'Chief Minister (Leader of the House)');
assert.strictEqual(cmRulingRes.success, true);
assert.strictEqual(sim.learners.find(l => l.id === 's1').role, 'Chief Minister');
console.log('✓ CM assigned to Ruling delegate successfully.');

// 3. Assign LOP to Ruling (should fail)
const lopRulingRes = sim.assignCabinetRole(EVENT_ID, 's3', 'Leader of the Opposition');
assert.strictEqual(lopRulingRes.success, false);
console.log('Ruling for LOP rejected:', lopRulingRes.message);

// 4. Assign LOP to Opposition (should succeed)
const lopOppRes = sim.assignCabinetRole(EVENT_ID, 's2', 'Leader of the Opposition');
assert.strictEqual(lopOppRes.success, true);
assert.strictEqual(sim.learners.find(l => l.id === 's2').role, 'Leader of Opposition');
console.log('✓ LOP assigned to Opposition delegate successfully.');

// 5. Assign Speaker to Independent (should succeed)
const speakerRes = sim.assignCabinetRole(EVENT_ID, 's4', 'Speaker of Legislative Assembly');
assert.strictEqual(speakerRes.success, true);
assert.strictEqual(sim.learners.find(l => l.id === 's4').role, 'Assembly Speaker');
console.log('✓ Speaker assigned successfully.');

// 6. Test Single Holder Reassignment (demote old CM s1 when s3 is appointed CM)
const cmReassignRes = sim.assignCabinetRole(EVENT_ID, 's3', 'Chief Minister');
assert.strictEqual(cmReassignRes.success, true);
assert.strictEqual(sim.learners.find(l => l.id === 's3').role, 'Chief Minister');
assert.strictEqual(sim.learners.find(l => l.id === 's1').role, 'Member of Legislative Assembly (MLA)', 'Old CM must be demoted to MLA');
console.log('✓ Single holder rule verified: s1 was automatically demoted to MLA when s3 was made CM.');

// 7. Test Unassigning a role
const unassignRes = sim.assignCabinetRole(EVENT_ID, '', 'Chief Minister');
assert.strictEqual(unassignRes.success, true);
assert.strictEqual(sim.learners.find(l => l.id === 's3').role, 'Member of Legislative Assembly (MLA)', 'CM must be cleared to MLA');
console.log('✓ Unassign verified: s3 was reset to MLA upon clearing role.');

console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
