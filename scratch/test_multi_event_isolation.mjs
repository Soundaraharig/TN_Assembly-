// Multi-Event Isolation Automated Test
import './setup_localStorage.mjs';

// 2. Import modules after polyfill
import { storageService } from '../src/services/storageService.ts';
import { findEventBySlug, getEventSlug } from '../src/utils/slug.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING TN ASSEMBLY MULTI-EVENT ISOLATION TEST SUITE');
  console.log('======================================================\n');

  const EVENT_A_ID = '200fdd74-4d21-44d5-9f63-9a07bf267824'; // JKKNCET TN ASSEMBLY 2026
  const EVENT_B_ID = 'b0000000-0000-0000-0000-000000000002'; // JKKN ARTS TN ASSEMBLY 2026

  // 1. Initialize Event A
  const eventA = {
    id: EVENT_A_ID,
    college_name: 'JKKNCET TN ASSEMBLY 2026',
    chapter: 'Tamil Nadu',
    level: 'College Round',
    location: 'Campus',
    dates: 'Upcoming',
    event_stage: 'College Round',
    status: 'Pre-Event',
    participant_count: 128,
    assigned_coordinator_email: 'soundaraharigece2025@jkkn.ac.in',
    assigned_coordinator_name: 'Soundarahari',
    slug: 'jkkncet-tn-assembly-2026-tamil-nadu-2026'
  };

  // 2. Initialize Event B
  const eventB = {
    id: EVENT_B_ID,
    college_name: 'JKKN ARTS TN ASSEMBLY 2026',
    chapter: 'Tamil Nadu',
    level: 'College Round',
    location: 'Arts Campus',
    dates: 'Upcoming',
    event_stage: 'College Round',
    status: 'Pre-Event',
    participant_count: 30,
    assigned_coordinator_email: 'soundaraharigece2025@jkkn.ac.in',
    assigned_coordinator_name: 'Soundarahari',
    slug: 'jkkn-arts-tn-assembly-2026-tamil-nadu-2026'
  };

  storageService.setItem('tn_assembly_events_v6', [eventA, eventB]);

  // Parties for Event A
  const partyA1 = { id: 'pty_a_1', event_id: EVENT_A_ID, name: 'Party 1', bench: 'Ruling', color: '#059669', leader: '', manifesto: '' };
  const partyA2 = { id: 'pty_a_2', event_id: EVENT_A_ID, name: 'Party 2', bench: 'Opposition', color: '#dc2626', leader: '', manifesto: '' };

  // Parties for Event B (sharing same party name 'Party 1' & 'Party 2' to test name collision isolation!)
  const partyB1 = { id: 'pty_b_1', event_id: EVENT_B_ID, name: 'Party 1', bench: 'Ruling', color: '#059669', leader: '', manifesto: '' };
  const partyB2 = { id: 'pty_b_2', event_id: EVENT_B_ID, name: 'Party 2', bench: 'Opposition', color: '#dc2626', leader: '', manifesto: '' };

  storageService.setItem('tn_assembly_parties_v6', [partyA1, partyA2, partyB1, partyB2]);

  // Learners for Event A (128 participants)
  const learnersA = [];
  for (let i = 1; i <= 128; i++) {
    learnersA.push({
      id: `l_a_${i}`,
      event_id: EVENT_A_ID,
      full_name: `Delegate A${i}`,
      access_code: `TNA${String(i).padStart(3, '0')}`,
      party_id: i <= 64 ? partyA1.id : partyA2.id,
      party_name: i <= 64 ? partyA1.name : partyA2.name,
      bench: i <= 64 ? 'Ruling' : 'Opposition',
      role: 'Member of Legislative Assembly (MLA)'
    });
  }

  // Learners for Event B (30 participants)
  const learnersB = [];
  for (let i = 1; i <= 30; i++) {
    learnersB.push({
      id: `l_b_${i}`,
      event_id: EVENT_B_ID,
      full_name: `Delegate B${i}`,
      access_code: `TNB${String(i).padStart(3, '0')}`,
      party_id: i <= 15 ? partyB1.id : partyB2.id,
      party_name: i <= 15 ? partyB1.name : partyB2.name,
      bench: i <= 15 ? 'Ruling' : 'Opposition',
      role: 'Member of Legislative Assembly (MLA)'
    });
  }

  storageService.setItem('tn_assembly_learners_v6', [...learnersA, ...learnersB]);

  // ── TEST 1: Strict Event Count and Integrity ──
  console.log('--- TEST 1: Participant Integrity ---');
  const initialLearnersA = storageService.getLearners(EVENT_A_ID);
  const initialLearnersB = storageService.getLearners(EVENT_B_ID);
  assert(initialLearnersA.length === 128, `Event A has exactly 128 participants (got ${initialLearnersA.length})`);
  assert(initialLearnersB.length === 30, `Event B has exactly 30 participants (got ${initialLearnersB.length})`);

  // ── TEST 2: Party Bench Mutation Isolation ──
  console.log('\n--- TEST 2: Party Bench Mutation Isolation ---');
  // Mutate Party B1 in Event B from Ruling to Opposition
  await storageService.setPartyBench(partyB1.id, 'Opposition', EVENT_B_ID);

  const partiesBAfter = storageService.getParties(EVENT_B_ID);
  const partyB1After = partiesBAfter.find(p => p.id === partyB1.id);
  assert(partyB1After.bench === 'Opposition', `Event B Party 1 switched to Opposition (got ${partyB1After.bench})`);

  const learnersBAfter = storageService.getLearners(EVENT_B_ID);
  const p1LearnerB = learnersBAfter.find(l => l.party_id === partyB1.id);
  assert(p1LearnerB.bench === 'Opposition', `Event B Learner in Party 1 bench updated to Opposition`);

  // Verify Event A Party 1 and Event A learners WERE NOT TOUCHED!
  const partiesAAfter = storageService.getParties(EVENT_A_ID);
  const partyA1After = partiesAAfter.find(p => p.id === partyA1.id);
  assert(partyA1After.bench === 'Ruling', `Event A Party 1 STILL Ruling (data did NOT leak to Event A!)`);

  const learnersAAfter = storageService.getLearners(EVENT_A_ID);
  const p1LearnerA = learnersAAfter.find(l => l.party_id === partyA1.id);
  assert(p1LearnerA.bench === 'Ruling', `Event A Learner in Party 1 STILL Ruling (bench did NOT leak!)`);

  // Now change Party A1 in Event A to Independent
  await storageService.setPartyBench(partyA1.id, 'Independent', EVENT_A_ID);
  const partyA1Final = storageService.getParties(EVENT_A_ID).find(p => p.id === partyA1.id);
  const partyB1Final = storageService.getParties(EVENT_B_ID).find(p => p.id === partyB1.id);
  assert(partyA1Final.bench === 'Independent', `Event A Party 1 updated to Independent`);
  assert(partyB1Final.bench === 'Opposition', `Event B Party 1 STILL Opposition (not affected by Event A change)`);

  // ── TEST 3: Leadership Role Isolation (CM, Speaker, LOP) ──
  console.log('\n--- TEST 3: Leadership Role Isolation (CM, Speaker, LOP) ---');
  // Restore Party A1 to Ruling and Party B1 to Ruling for CM assignment testing
  await storageService.setPartyBench(partyA1.id, 'Ruling', EVENT_A_ID);
  await storageService.setPartyBench(partyB1.id, 'Ruling', EVENT_B_ID);

  // Assign roles in Event A
  storageService.assignCabinetRole(EVENT_A_ID, 'l_a_1', 'Chief Minister');
  storageService.assignCabinetRole(EVENT_A_ID, 'l_a_65', 'Leader of Opposition');
  storageService.assignCabinetRole(EVENT_A_ID, 'l_a_2', 'Speaker');

  // Assign roles in Event B
  storageService.assignCabinetRole(EVENT_B_ID, 'l_b_1', 'Chief Minister');
  storageService.assignCabinetRole(EVENT_B_ID, 'l_b_16', 'Leader of Opposition');
  storageService.assignCabinetRole(EVENT_B_ID, 'l_b_2', 'Speaker');

  const refreshedA = storageService.getLearners(EVENT_A_ID);
  const refreshedB = storageService.getLearners(EVENT_B_ID);

  const cmA = refreshedA.find(l => l.role?.toLowerCase().includes('chief minister'));
  const cmB = refreshedB.find(l => l.role?.toLowerCase().includes('chief minister'));
  assert(cmA?.id === 'l_a_1', `Event A Chief Minister is Delegate A1 (l_a_1)`);
  assert(cmB?.id === 'l_b_1', `Event B Chief Minister is Delegate B1 (l_b_1)`);

  const lopA = refreshedA.find(l => l.role?.toLowerCase().includes('opposition'));
  const lopB = refreshedB.find(l => l.role?.toLowerCase().includes('opposition'));
  assert(lopA?.id === 'l_a_65', `Event A LOP is Delegate A65 (l_a_65)`);
  assert(lopB?.id === 'l_b_16', `Event B LOP is Delegate B16 (l_b_16)`);

  const spkA = refreshedA.find(l => l.role?.toLowerCase().includes('speaker'));
  const spkB = refreshedB.find(l => l.role?.toLowerCase().includes('speaker'));
  assert(spkA?.id === 'l_a_2', `Event A Speaker is Delegate A2 (l_a_2)`);
  assert(spkB?.id === 'l_b_2', `Event B Speaker is Delegate B2 (l_b_2)`);

  // Now reassign Chief Minister in Event B to Delegate B3
  storageService.assignCabinetRole(EVENT_B_ID, 'l_b_3', 'Chief Minister');
  const recheckA = storageService.getLearners(EVENT_A_ID);
  const recheckB = storageService.getLearners(EVENT_B_ID);
  const newCmB = recheckB.find(l => l.role?.toLowerCase().includes('chief minister'));
  const oldCmB = recheckB.find(l => l.id === 'l_b_1');
  const recheckCmA = recheckA.find(l => l.role?.toLowerCase().includes('chief minister'));

  assert(newCmB?.id === 'l_b_3', `Event B CM successfully reappointed to Delegate B3`);
  assert(oldCmB?.role !== 'Chief Minister', `Event B previous CM reset to standard role`);
  assert(recheckCmA?.id === 'l_a_1', `Event A CM is STILL Delegate A1 (MUTATION IN EVENT B DID NOT LEAK TO EVENT A!)`);

  // Verify dual-layer leadership roles index on events
  const rolesIndexA = storageService.getLeadershipRoles(EVENT_A_ID);
  const rolesIndexB = storageService.getLeadershipRoles(EVENT_B_ID);
  assert(rolesIndexA['Chief Minister'] === 'l_a_1', `Event A index tracks Chief Minister = l_a_1`);
  assert(rolesIndexB['Chief Minister'] === 'l_b_3', `Event B index tracks Chief Minister = l_b_3`);

  // ── TEST 4: restoreJkkncetEvent Defensively Preserves Event B ──
  console.log('\n--- TEST 4: restoreJkkncetEvent Non-Collapsing Verification ---');
  storageService.restoreJkkncetEvent();
  const allEventsAfter = storageService.getEvents();
  const preservedB = allEventsAfter.find(e => e.id === EVENT_B_ID);
  assert(preservedB?.college_name === 'JKKN ARTS TN ASSEMBLY 2026', `Event B college_name remained intact ('${preservedB?.college_name}')`);
  assert(preservedB?.slug === 'jkkn-arts-tn-assembly-2026-tamil-nadu-2026', `Event B slug remained intact ('${preservedB?.slug}')`);

  // ── TEST 5: Slug Resolution Isolation ──
  console.log('\n--- TEST 5: Slug Resolution Disambiguation ---');
  const resolvedA = findEventBySlug(allEventsAfter, 'jkkncet-tn-assembly-2026-tamil-nadu-2026');
  const resolvedB = findEventBySlug(allEventsAfter, 'jkkn-arts-tn-assembly-2026-tamil-nadu-2026');
  assert(resolvedA?.id === EVENT_A_ID, `Slug resolves strictly to Event A`);
  assert(resolvedB?.id === EVENT_B_ID, `Slug resolves strictly to Event B`);

  // ── TEST 6: Preservation of 128 Delegates ──
  console.log('\n--- TEST 6: Preservation of 128 JKKNCET Delegates ---');
  const finalLearnersA = storageService.getLearners(EVENT_A_ID);
  assert(finalLearnersA.length === 128, `All 128 original participants in JKKNCET event remain 100% intact!`);

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
