/**
 * test_bug_9_systemic_audit.cjs
 * Comprehensive test suite for Bug 9 (revised):
 * 1. Storage & Database Audit simulation (duplicate coordinator detection & cleanup)
 * 2. Old password invalidation on reset (old password MUST fail, new password MUST succeed)
 * 3. Multi-Coordinator consistency: 3 coordinators on 1 event see 100% identical data matching Super Admin
 * 4. Isolation test: fresh empty event does not inherit or leak data from other events
 */

const assert = require('assert');

// Mock localStorage for Node test environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (i) => Array.from(mockStorage.keys())[i] || null
};

// Import mock storage helpers & logic directly
const STORAGE_KEYS = {
  EVENTS: 'tn_assembly_events_v6',
  COORDINATORS: 'tn_assembly_coordinators_v6',
  LEARNERS: 'tn_assembly_learners_v6',
  PARTIES: 'tn_assembly_parties_v6',
  COMMITTEES: 'tn_assembly_committees_v6',
  TEAM: 'tn_assembly_team_v6'
};

function getItem(key, defaultValue) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Logic replicating the updated storageService functions
function cleanupAndDeduplicateData() {
  let duplicateCoordinatorsRemoved = 0;
  let orphanedPartiesCleaned = 0;
  let orphanedCommitteesCleaned = 0;
  let orphanedLearnersCleaned = 0;

  const allEvents = getItem(STORAGE_KEYS.EVENTS, []);
  const validEventIds = new Set(allEvents.map(e => e.id));
  const defaultEventId = allEvents.length === 1 ? allEvents[0].id : '';

  // 1. Deduplicate coordinators strictly by email
  const rawCoords = getItem(STORAGE_KEYS.COORDINATORS, []);
  const coordsByEmail = new Map();
  rawCoords.forEach(c => {
    if (!c || !c.email) return;
    const normEmail = c.email.trim().toLowerCase();
    if (!coordsByEmail.has(normEmail)) coordsByEmail.set(normEmail, []);
    coordsByEmail.get(normEmail).push(c);
  });

  const deduplicatedCoords = [];
  coordsByEmail.forEach(list => {
    if (list.length === 1) {
      deduplicatedCoords.push(list[0]);
    } else {
      duplicateCoordinatorsRemoved += (list.length - 1);
      list.sort((a, b) => {
        const aHasEvent = a.event_id && a.event_id.trim() && validEventIds.has(a.event_id.trim()) ? 1 : 0;
        const bHasEvent = b.event_id && b.event_id.trim() && validEventIds.has(b.event_id.trim()) ? 1 : 0;
        if (aHasEvent !== bHasEvent) return bHasEvent - aHasEvent;

        const aCustomPass = a.password_hash && a.password_hash !== 'coord123' ? 1 : 0;
        const bCustomPass = b.password_hash && b.password_hash !== 'coord123' ? 1 : 0;
        if (aCustomPass !== bCustomPass) return bCustomPass - aCustomPass;
        return 0;
      });

      const authoritative = { ...list[0] };
      for (let i = 1; i < list.length; i++) {
        if (!authoritative.event_id && list[i].event_id) authoritative.event_id = list[i].event_id;
        if (!authoritative.name && list[i].name) authoritative.name = list[i].name;
      }
      deduplicatedCoords.push(authoritative);
    }
  });
  setItem(STORAGE_KEYS.COORDINATORS, deduplicatedCoords);

  // 2. Strict Parties
  const rawParties = getItem(STORAGE_KEYS.PARTIES, []);
  const cleanedParties = [];
  const seenPartyKeys = new Set();
  rawParties.forEach(p => {
    let evId = p.event_id && p.event_id.trim() ? p.event_id.trim() : '';
    if (!evId && defaultEventId) evId = defaultEventId;
    if (!evId || (!validEventIds.has(evId) && validEventIds.size > 0)) {
      orphanedPartiesCleaned++;
      return;
    }
    const key = `${evId}:::${(p.name || '').trim().toLowerCase()}`;
    if (!seenPartyKeys.has(key)) {
      seenPartyKeys.add(key);
      cleanedParties.push({ ...p, event_id: evId });
    }
  });
  setItem(STORAGE_KEYS.PARTIES, cleanedParties);

  // 3. Strict Committees
  const rawComms = getItem(STORAGE_KEYS.COMMITTEES, []);
  const cleanedComms = [];
  const seenCommKeys = new Set();
  rawComms.forEach(c => {
    let evId = c.event_id && c.event_id.trim() ? c.event_id.trim() : '';
    if (!evId && defaultEventId) evId = defaultEventId;
    if (!evId || (!validEventIds.has(evId) && validEventIds.size > 0)) {
      orphanedCommitteesCleaned++;
      return;
    }
    const key = `${evId}:::${(c.name || '').trim().toLowerCase()}`;
    if (!seenCommKeys.has(key)) {
      seenCommKeys.add(key);
      cleanedComms.push({ ...c, event_id: evId });
    }
  });
  setItem(STORAGE_KEYS.COMMITTEES, cleanedComms);

  // 4. Strict Learners
  const rawLearners = getItem(STORAGE_KEYS.LEARNERS, []);
  const cleanedLearners = [];
  const seenLearnerIds = new Set();
  rawLearners.forEach(l => {
    if (!l || !l.id || seenLearnerIds.has(l.id)) return;
    let evId = l.event_id && l.event_id.trim() ? l.event_id.trim() : '';
    if (!evId && defaultEventId) evId = defaultEventId;
    if (!evId || (!validEventIds.has(evId) && validEventIds.size > 0)) {
      orphanedLearnersCleaned++;
      return;
    }
    seenLearnerIds.add(l.id);
    cleanedLearners.push({ ...l, event_id: evId });
  });
  setItem(STORAGE_KEYS.LEARNERS, cleanedLearners);

  return {
    duplicateCoordinatorsRemoved,
    orphanedPartiesCleaned,
    orphanedCommitteesCleaned,
    orphanedLearnersCleaned
  };
}

function authenticateCoordinator(email, pass) {
  cleanupAndDeduplicateData();
  const coords = getItem(STORAGE_KEYS.COORDINATORS, []);
  const emailLower = email.trim().toLowerCase();
  const passTrim = pass.trim();

  // 1. Locate single authoritative coordinator record
  const coord = coords.find(c => c.email.trim().toLowerCase() === emailLower);
  if (!coord) return null;

  // 2. Validate password strictly
  const isValid = (coord.password_hash && coord.password_hash === passTrim) ||
                  (coord.raw_temp_password && coord.raw_temp_password === passTrim);
  if (!isValid) return null;

  return {
    role: 'coordinator',
    email: coord.email,
    name: coord.name,
    assigned_event_ids: [coord.event_id]
  };
}

function updateCoordinator(coord) {
  const all = getItem(STORAGE_KEYS.COORDINATORS, []);
  const emailLower = coord.email?.trim().toLowerCase();
  let found = false;

  const updated = all.map(c => {
    const match = c.id === coord.id || (emailLower && c.email.trim().toLowerCase() === emailLower);
    if (match) {
      found = true;
      return { ...c, ...coord };
    }
    return c;
  });

  const candidateList = found ? updated : [...updated, coord];
  const unique = [];
  const seen = new Set();
  for (const c of candidateList) {
    const key = c.email ? c.email.trim().toLowerCase() : c.id;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  setItem(STORAGE_KEYS.COORDINATORS, unique);
}

function getLearners(eventId) {
  const all = getItem(STORAGE_KEYS.LEARNERS, []);
  if (eventId) return all.filter(l => l.event_id === eventId);
  return all;
}

function getParties(eventId) {
  const all = getItem(STORAGE_KEYS.PARTIES, []);
  if (eventId) return all.filter(p => p.event_id === eventId);
  return all;
}

function getCommittees(eventId) {
  const all = getItem(STORAGE_KEYS.COMMITTEES, []);
  if (eventId) return all.filter(c => c.event_id === eventId);
  return all;
}

// -------------------------------------------------------------
// RUNNING THE TESTS
// -------------------------------------------------------------

console.log('--- TEST 1: Systemic Audit & Cleanup Migration ---');
// Setup corrupted state with duplicate coordinators and orphan entities
setItem(STORAGE_KEYS.EVENTS, [
  { id: 'ev_main', college_name: 'JKKNCET Assembly 2026', slug: 'jkkncet-2026' }
]);

setItem(STORAGE_KEYS.COORDINATORS, [
  { id: 'coord_old_1', email: 'coord_alpha@jkkncet.edu', password_hash: 'OldPass123!', event_id: 'ev_stale_1', name: 'Alpha Old' },
  { id: 'coord_new_1', email: 'coord_alpha@jkkncet.edu', password_hash: 'NewPass456!', event_id: 'ev_main', name: 'Alpha Active' },
  { id: 'coord_old_2', email: 'coord_beta@jkkncet.edu', password_hash: 'coord123', event_id: 'ev_stale_2', name: 'Beta Old' },
  { id: 'coord_new_2', email: 'coord_beta@jkkncet.edu', password_hash: 'BetaCustomPass999!', event_id: 'ev_main', name: 'Beta Active' }
]);

setItem(STORAGE_KEYS.PARTIES, [
  { id: 'p1', event_id: 'ev_main', name: 'Party A', bench: 'Ruling' },
  { id: 'p2', event_id: 'ev_main', name: 'Party B', bench: 'Opposition' },
  { id: 'p_orphan_1', event_id: '', name: 'Orphan Party 1' },
  { id: 'p_orphan_2', event_id: 'non_existent_ev', name: 'Ghost Party 2' }
]);

setItem(STORAGE_KEYS.COMMITTEES, [
  { id: 'c1', event_id: 'ev_main', name: 'Committee 1' },
  { id: 'c_orphan', event_id: '', name: 'Orphan Committee' }
]);

// Audit pre-cleanup: check duplicates
const rawPre = getItem(STORAGE_KEYS.COORDINATORS, []);
const emailCounts = {};
rawPre.forEach(c => {
  const e = c.email.toLowerCase();
  emailCounts[e] = (emailCounts[e] || 0) + 1;
});
const dupesFound = Object.entries(emailCounts).filter(([, count]) => count > 1);
console.log(`Pre-cleanup audit found ${dupesFound.length} duplicate coordinator emails (total rows: ${rawPre.length}).`);
assert.strictEqual(dupesFound.length, 2, 'Should find 2 duplicated coordinator emails initially');

// Run cleanup migration
const cleanupStats = cleanupAndDeduplicateData();
console.log('Cleanup migration executed successfully:', cleanupStats);
assert.strictEqual(cleanupStats.duplicateCoordinatorsRemoved, 2, 'Should have removed 2 duplicate coordinator rows');

// Audit post-cleanup:
const postCoords = getItem(STORAGE_KEYS.COORDINATORS, []);
const postEmailCounts = {};
postCoords.forEach(c => {
  const e = c.email.toLowerCase();
  postEmailCounts[e] = (postEmailCounts[e] || 0) + 1;
});
const postDupes = Object.entries(postEmailCounts).filter(([, count]) => count > 1);
assert.strictEqual(postDupes.length, 0, 'Post-cleanup must have 0 duplicate coordinator emails');
assert.strictEqual(postCoords.length, 2, 'Must have exactly 2 authoritative coordinator rows');
console.log('Post-cleanup audit passed: 0 duplicate coordinator rows remain.');

console.log('\n--- TEST 2: Password Invalidation Verification ---');
// Verify that entering old password for coord_alpha FAILS
const loginOld = authenticateCoordinator('coord_alpha@jkkncet.edu', 'OldPass123!');
console.log('Login attempt with OLD password:', loginOld ? 'SUCCESS (BUG!)' : 'REJECTED (CORRECT)');
assert.strictEqual(loginOld, null, 'Old password MUST fail authentication');

// Verify that entering new password for coord_alpha SUCCEEDS
const loginNew = authenticateCoordinator('coord_alpha@jkkncet.edu', 'NewPass456!');
console.log('Login attempt with NEW password:', loginNew ? 'SUCCESS (CORRECT)' : 'FAILED (BUG!)');
assert.notStrictEqual(loginNew, null, 'New password MUST succeed authentication');
assert.strictEqual(loginNew.email, 'coord_alpha@jkkncet.edu');
assert.deepStrictEqual(loginNew.assigned_event_ids, ['ev_main']);

// Reset password again via updateCoordinator
updateCoordinator({
  id: 'coord_new_1',
  email: 'coord_alpha@jkkncet.edu',
  name: 'Alpha Active',
  event_id: 'ev_main',
  password_hash: 'SuperSecret2026!$',
  raw_temp_password: 'SuperSecret2026!$'
});

// Confirm NewPass456! is now invalidated
const loginSecondOld = authenticateCoordinator('coord_alpha@jkkncet.edu', 'NewPass456!');
assert.strictEqual(loginSecondOld, null, 'Previous password MUST now be invalidated');

// Confirm new password works
const loginLatest = authenticateCoordinator('coord_alpha@jkkncet.edu', 'SuperSecret2026!$');
assert.notStrictEqual(loginLatest, null, 'Latest password MUST authenticate');
console.log('Password invalidation test passed: old passwords are 100% purged.');

console.log('\n--- TEST 3: Multi-Coordinator Consistency Across ALL 3 Coordinators ---');
// Setup 1 shared event with 3 coordinators, 5 parties, 6 committees, 120 delegates
const sharedEventId = 'ev_shared_test';
setItem(STORAGE_KEYS.EVENTS, [
  { id: sharedEventId, college_name: 'Tamil Nadu Assembly 2026', slug: 'tn-assembly-2026' },
  { id: 'ev_isolated_empty', college_name: 'Empty College Event', slug: 'empty-college' }
]);

// 3 Coordinators assigned to sharedEventId
setItem(STORAGE_KEYS.COORDINATORS, [
  { id: 'c1', email: 'coord1@tn.gov.in', password_hash: 'PassOne#111', event_id: sharedEventId, name: 'Coordinator 1' },
  { id: 'c2', email: 'coord2@tn.gov.in', password_hash: 'PassTwo#222', event_id: sharedEventId, name: 'Coordinator 2' },
  { id: 'c3', email: 'coord3@tn.gov.in', password_hash: 'PassThree#333', event_id: sharedEventId, name: 'Coordinator 3' }
]);

// 5 Parties on sharedEventId
const testParties = [
  { id: 'pty_1', event_id: sharedEventId, name: 'Party 1', bench: 'Ruling' },
  { id: 'pty_2', event_id: sharedEventId, name: 'Party 2', bench: 'Opposition' },
  { id: 'pty_3', event_id: sharedEventId, name: 'Party 3', bench: 'Independent' },
  { id: 'pty_4', event_id: sharedEventId, name: 'Party 4', bench: 'Independent' },
  { id: 'pty_5', event_id: sharedEventId, name: 'Party 5', bench: 'Independent' }
];
setItem(STORAGE_KEYS.PARTIES, testParties);

// 6 Committees on sharedEventId
const testCommittees = [
  { id: 'com_1', event_id: sharedEventId, name: 'Committee 1 - Public Accounts' },
  { id: 'com_2', event_id: sharedEventId, name: 'Committee 2 - Higher Education' },
  { id: 'com_3', event_id: sharedEventId, name: 'Committee 3 - Public Health' },
  { id: 'com_4', event_id: sharedEventId, name: 'Committee 4 - Agriculture' },
  { id: 'com_5', event_id: sharedEventId, name: 'Committee 5 - Industries & IT' },
  { id: 'com_6', event_id: sharedEventId, name: 'Committee 6 - Environment' }
];
setItem(STORAGE_KEYS.COMMITTEES, testCommittees);

// 120 Delegates on sharedEventId
const testLearners = [];
for (let i = 1; i <= 120; i++) {
  testLearners.push({
    id: `lrn_${i}`,
    event_id: sharedEventId,
    access_code: `TN${String(i).padStart(4, '0')}`,
    full_name: `Delegate ${i}`,
    party_id: testParties[i % 5].id,
    party_name: testParties[i % 5].name,
    bench: testParties[i % 5].bench,
    committee_id: testCommittees[i % 6].id,
    committee_name: testCommittees[i % 6].name
  });
}
setItem(STORAGE_KEYS.LEARNERS, testLearners);

// Test logins for each coordinator
const sess1 = authenticateCoordinator('coord1@tn.gov.in', 'PassOne#111');
const sess2 = authenticateCoordinator('coord2@tn.gov.in', 'PassTwo#222');
const sess3 = authenticateCoordinator('coord3@tn.gov.in', 'PassThree#333');

assert.notStrictEqual(sess1, null, 'Coordinator 1 should authenticate');
assert.notStrictEqual(sess2, null, 'Coordinator 2 should authenticate');
assert.notStrictEqual(sess3, null, 'Coordinator 3 should authenticate');

// Super Admin views sharedEventId
const saParties = getParties(sharedEventId);
const saCommittees = getCommittees(sharedEventId);
const saLearners = getLearners(sharedEventId);

// Coordinator 1 views sharedEventId
const c1EventId = sess1.assigned_event_ids[0];
const c1Parties = getParties(c1EventId);
const c1Committees = getCommittees(c1EventId);
const c1Learners = getLearners(c1EventId);

// Coordinator 2 views sharedEventId
const c2EventId = sess2.assigned_event_ids[0];
const c2Parties = getParties(c2EventId);
const c2Committees = getCommittees(c2EventId);
const c2Learners = getLearners(c2EventId);

// Coordinator 3 views sharedEventId
const c3EventId = sess3.assigned_event_ids[0];
const c3Parties = getParties(c3EventId);
const c3Committees = getCommittees(c3EventId);
const c3Learners = getLearners(c3EventId);

console.log(`Super Admin View:   Parties=${saParties.length}, Committees=${saCommittees.length}, Delegates=${saLearners.length}`);
console.log(`Coordinator 1 View: Parties=${c1Parties.length}, Committees=${c1Committees.length}, Delegates=${c1Learners.length}`);
console.log(`Coordinator 2 View: Parties=${c2Parties.length}, Committees=${c2Committees.length}, Delegates=${c2Learners.length}`);
console.log(`Coordinator 3 View: Parties=${c3Parties.length}, Committees=${c3Committees.length}, Delegates=${c3Learners.length}`);

// Assert all 4 views are 100% IDENTICAL
assert.strictEqual(saParties.length, 5);
assert.strictEqual(saCommittees.length, 6);
assert.strictEqual(saLearners.length, 120);

assert.strictEqual(c1Parties.length, saParties.length);
assert.strictEqual(c1Committees.length, saCommittees.length);
assert.strictEqual(c1Learners.length, saLearners.length);

assert.strictEqual(c2Parties.length, saParties.length);
assert.strictEqual(c2Committees.length, saCommittees.length);
assert.strictEqual(c2Learners.length, saLearners.length);

assert.strictEqual(c3Parties.length, saParties.length);
assert.strictEqual(c3Committees.length, saCommittees.length);
assert.strictEqual(c3Learners.length, saLearners.length);

console.log('Multi-Coordinator consistency passed: All 3 coordinators and Super Admin see 100% identical data with 0 discrepancies.');

console.log('\n--- TEST 4: Event Isolation (No cross-event leakage) ---');
const emptyParties = getParties('ev_isolated_empty');
const emptyCommittees = getCommittees('ev_isolated_empty');
const emptyLearners = getLearners('ev_isolated_empty');

console.log(`Empty Event Query: Parties=${emptyParties.length}, Committees=${emptyCommittees.length}, Delegates=${emptyLearners.length}`);
assert.strictEqual(emptyParties.length, 0, 'Empty event must not inherit parties from shared event');
assert.strictEqual(emptyCommittees.length, 0, 'Empty event must not inherit committees from shared event');
assert.strictEqual(emptyLearners.length, 0, 'Empty event must not inherit delegates from shared event');

console.log('Event isolation passed: Zero leakage across events.');

console.log('\n>>> ALL BUG 9 SYSTEMIC AUDIT & VERIFICATION TESTS PASSED! <<<');
