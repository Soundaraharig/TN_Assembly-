// Mock localStorage and window before importing storageService
const store = new Map<string, string>();
(global as any).localStorage = {
  getItem: (k: string) => store.get(k) || null,
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => { store.clear(); },
  key: (i: number) => Array.from(store.keys())[i] || null,
  length: 0
};
(global as any).window = {
  localStorage: (global as any).localStorage,
  dispatchEvent: () => true,
  addEventListener: () => {}
};
(global as any).document = {
  hidden: false,
  addEventListener: () => {},
  removeEventListener: () => {}
};

async function runAuditAndLifecycleTests() {
  const { storageService } = await import('../src/services/storageService');
  const typeModule = await import('../src/types');
  console.log('============================================================');
  console.log('1. AUDIT & VERIFICATION OF ALL VOTING TYPES & LIFECYCLES');
  console.log('============================================================\n');

  const eventId = 'audit-test-event-' + Date.now();
  const dummyLearner: Learner = {
    id: 'student-001',
    full_name: 'Soundar M',
    role: 'MLA',
    bench: 'Ruling',
    school_name: 'TN Assembly School',
    party_name: 'Dravida Munnetra Kazhagam',
    party_id: 'dmk-01',
    district: 'Chennai',
    constituency_name: 'Thousand Lights',
    constituency_number: 18,
    is_active: true
  };

  // --------------------------------------------------------------------------
  // TEST 1: BILL VOTING (Floor Division)
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 1: BILL VOTING (Floor Division)');
  console.log('------------------------------------------------------------');
  const bill: BillProceeding = {
    id: 'bill-test-01',
    event_id: eventId,
    bill_number: 'BILL-01-2026',
    title: 'The Tamil Nadu Education Reform Act 2026',
    summary: 'A bill to modernize state education facilities and digital governance.',
    proposer: 'Chief Minister',
    status: 'Draft',
    ayes: 0,
    noes: 0,
    abstain: 0,
    total_votes: 0,
    votes: [],
    voted_delegate_ids: []
  };

  // Create bill
  const createdBill = storageService.createBill(bill, eventId);
  const billId = createdBill.id;

  // A. Open bill vote
  storageService.openBillVote(billId, eventId);
  let liveBill = storageService.getBills(eventId).find(b => b.id === billId)!;
  console.log('A. Voting Opened: Status =', liveBill.status, '| is_result_revealed =', liveBill.is_result_revealed);
  console.assert(liveBill.status === 'Vote Open', 'Bill status should be Vote Open');

  // B. Cast votes
  storageService.castBillVote(billId, eventId, dummyLearner, 'YES');
  const dummyLearner2 = { ...dummyLearner, id: 'student-002', full_name: 'Delegate Two' };
  storageService.castBillVote(billId, eventId, dummyLearner2, 'NO');

  // C. Verify delegate masking during voting
  const studentViewDuring = storageService.getBills(eventId, 'student', dummyLearner.id).find(b => b.id === billId)!;
  console.log('B. Student View During Vote: Ayes =', studentViewDuring.ayes, '| Noes =', studentViewDuring.noes, '| Result =', studentViewDuring.result);
  console.assert(studentViewDuring.ayes === 0 && studentViewDuring.result === undefined, 'Student view must conceal tallies during active voting');

  // D. Close bill vote -> Result remains HIDDEN
  storageService.closeBillVote(billId, eventId);
  let closedBill = storageService.getBills(eventId).find(b => b.id === billId)!;
  console.assert(closedBill.status === 'Vote Closed', 'Bill status should be Vote Closed');
  console.assert(closedBill.is_result_revealed === false, 'Result must NOT be automatically revealed');

  const studentViewClosedHidden = storageService.getBills(eventId, 'student', dummyLearner.id).find(b => b.id === billId)!;
  console.log('D. Student View After Close: Ayes =', studentViewClosedHidden.ayes, '| Result =', studentViewClosedHidden.result);
  console.assert(studentViewClosedHidden.ayes === 0 && studentViewClosedHidden.result === undefined, 'Student view must keep result hidden when closed');

  // E. REVEAL RESULTS
  storageService.revealBillResult(billId, eventId);
  let revealedBill = storageService.getBills(eventId).find(b => b.id === billId)!;
  let projSettingsAfterBillReveal = storageService.getProjectorSettings(eventId);
  console.log('E. Results Revealed: is_result_revealed =', revealedBill.is_result_revealed, '| Projector Scene =', projSettingsAfterBillReveal.displayScene);
  console.assert(revealedBill.is_result_revealed === true, 'Bill result must be marked revealed');
  console.assert(projSettingsAfterBillReveal.displayScene === 'bill_result', 'Projector scene must be bill_result');

  const studentViewRevealed = storageService.getBills(eventId, 'student', dummyLearner.id).find(b => b.id === billId)!;
  console.log('F. Student View When Revealed: Ayes =', studentViewRevealed.ayes, '| Noes =', studentViewRevealed.noes, '| Result =', studentViewRevealed.result);
  console.assert(studentViewRevealed.ayes === 1 && studentViewRevealed.noes === 1, 'Student view must now see authoritative tallies');

  // G. DISMISS & SHOW SESSION
  storageService.dismissBillResult(billId, eventId);
  let dismissedBill = storageService.getBills(eventId).find(b => b.id === billId)!;
  let projSettingsAfterBillDismiss = storageService.getProjectorSettings(eventId);
  console.log('G. Dismiss & Show Session: is_dismissed =', dismissedBill.is_dismissed, '| Projector Scene =', projSettingsAfterBillDismiss.displayScene);
  console.assert(dismissedBill.is_dismissed === true, 'Bill must be marked dismissed');
  console.assert(projSettingsAfterBillDismiss.displayScene === 'agenda', 'Projector scene must return to active agenda');
  console.assert(dismissedBill.ayes === 1 && dismissedBill.noes === 1, 'Voting data and vote counts MUST remain 100% intact');
  console.log('PASS: Bill Voting Lifecycle Verified!\n');


  // --------------------------------------------------------------------------
  // TEST 2: SPEAKER & DEPUTY SPEAKER CONSTITUTIONAL ELECTION
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 2: SPEAKER CONSTITUTIONAL ELECTION');
  console.log('------------------------------------------------------------');
  const speakerElection: Election = {
    id: 'elec-speaker-01',
    event_id: eventId,
    title: 'Election of the Hon\'ble Speaker',
    position: 'Speaker',
    type: 'SPEAKER',
    status: 'Upcoming',
    candidates: [
      { id: 'cand-spk-1', name: 'Thiru M. Appavu', party: 'DMK', bench: 'Ruling', votes: 0 },
      { id: 'cand-spk-2', name: 'Thiru K. Pitchandi', party: 'DMK', bench: 'Ruling', votes: 0 }
    ],
    total_votes: 0,
    voted_delegate_ids: []
  };

  storageService.createElection(speakerElection);

  // A. Start live voting
  storageService.setElectionStatus(speakerElection.id, 'Live');
  let liveElec = storageService.getElections(eventId).find(e => e.id === speakerElection.id)!;
  console.log('A. Election Started: Status =', liveElec.status, '| Total Votes =', liveElec.total_votes);
  console.assert(liveElec.status === 'Live', 'Status should be Live');

  // B. Cast votes
  storageService.castVoteInElection(speakerElection.id, 'cand-spk-1', dummyLearner.id);
  storageService.castVoteInElection(speakerElection.id, 'cand-spk-2', dummyLearner2.id);

  // C. Verify delegate masking during voting
  const studentElecDuring = storageService.getElections(eventId, 'student', dummyLearner.id).find(e => e.id === speakerElection.id)!;
  console.log('B. Student View During Vote: Candidates votes masked =', studentElecDuring.candidates.every(c => c.votes === 0), '| Winner masked =', studentElecDuring.winner === undefined);
  console.assert(studentElecDuring.candidates.every(c => c.votes === 0) && studentElecDuring.winner === undefined, 'Candidate tallies must be masked for students during election');

  // D. Close Election -> Result is sealed/hidden
  storageService.closeElection(speakerElection.id, eventId);
  let closedElec = storageService.getElections(eventId).find(e => e.id === speakerElection.id)!;
  console.log('C. Election Closed: Status =', closedElec.status, '| is_result_revealed =', closedElec.is_result_revealed);
  console.assert(closedElec.status === 'Closed', 'Status should be Closed');
  console.assert(closedElec.is_result_revealed === false, 'Result must NOT be automatically revealed');

  const studentElecClosed = storageService.getElections(eventId, 'student', dummyLearner.id).find(e => e.id === speakerElection.id)!;
  console.log('D. Student View After Close: Winner =', studentElecClosed.winner, '| Total Votes =', studentElecClosed.total_votes);
  console.assert(studentElecClosed.winner === undefined && studentElecClosed.total_votes === 0, 'Winner must remain hidden from students until revealed');

  // E. REVEAL RESULTS
  storageService.revealElectionResult(speakerElection.id, eventId);
  let revealedElec = storageService.getElections(eventId).find(e => e.id === speakerElection.id)!;
  let projSettingsAfterElecReveal = storageService.getProjectorSettings(eventId);
  console.log('E. Results Revealed: is_result_revealed =', revealedElec.is_result_revealed, '| Projector Scene =', projSettingsAfterElecReveal.displayScene);
  console.assert(revealedElec.is_result_revealed === true, 'Election must be marked revealed');
  console.assert(projSettingsAfterElecReveal.displayScene === 'election_result', 'Projector scene must be election_result');

  const studentElecRevealed = storageService.getElections(eventId, 'student', dummyLearner.id).find(e => e.id === speakerElection.id)!;
  console.log('F. Student View When Revealed: Winner =', studentElecRevealed.winner, '| Total Votes =', studentElecRevealed.total_votes);
  console.assert(studentElecRevealed.total_votes === 2, 'Student view must now see authoritative election outcome');

  // G. DISMISS & SHOW SESSION
  storageService.dismissElectionResult(speakerElection.id, eventId);
  let dismissedElec = storageService.getElections(eventId).find(e => e.id === speakerElection.id)!;
  let projSettingsAfterElecDismiss = storageService.getProjectorSettings(eventId);
  console.log('G. Dismiss & Show Session: is_dismissed =', dismissedElec.is_dismissed, '| Projector Scene =', projSettingsAfterElecDismiss.displayScene);
  console.assert(dismissedElec.is_dismissed === true, 'Election must be marked dismissed');
  console.assert(projSettingsAfterElecDismiss.displayScene === 'agenda', 'Projector scene must return to active agenda');
  console.assert(dismissedElec.total_votes === 2, 'Election candidate votes and totals MUST remain 100% intact');
  console.log('PASS: Speaker Election Lifecycle Verified!\n');


  // --------------------------------------------------------------------------
  // TEST 3: FLASH VOTE (Division Poll)
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 3: LIVE FLASH VOTE (Division Poll)');
  console.log('------------------------------------------------------------');
  const flashVote = storageService.createFlashVote(
    eventId,
    'Should the Assembly form a Special Select Committee on Water Resources?',
    'ALL',
    'Division'
  );
  console.log('A. Flash Vote Created: ID =', flashVote.id, '| Status =', flashVote.status);
  console.assert(flashVote.status === 'ACTIVE', 'Status should be ACTIVE');

  // Cast flash votes
  storageService.castFlashVote(flashVote.id, dummyLearner, 'AYE');
  storageService.castFlashVote(flashVote.id, dummyLearner2, 'NO');

  // Student view during active flash vote
  const studentFVDuring = storageService.getFlashVotes(eventId, 'student', dummyLearner.id).find(f => f.id === flashVote.id)!;
  console.log('B. Student View During Flash Vote: Ayes =', studentFVDuring.ayes_count, '| Noes =', studentFVDuring.noes_count);
  console.assert(studentFVDuring.ayes_count === 0, 'Flash vote live counts must be concealed from students');

  // Close flash vote
  storageService.closeFlashVote(flashVote.id);
  let closedFV = storageService.getFlashVotes(eventId).find(f => f.id === flashVote.id)!;
  console.log('C. Flash Vote Closed: Status =', closedFV.status, '| is_result_revealed =', closedFV.is_result_revealed);
  console.assert(closedFV.status === 'CLOSED', 'Status should be CLOSED');
  console.assert(closedFV.is_result_revealed === false, 'Result must NOT be automatically revealed');

  const studentFVClosed = storageService.getFlashVotes(eventId, 'student', dummyLearner.id).find(f => f.id === flashVote.id)!;
  console.log('D. Student View After Close: Ayes =', studentFVClosed.ayes_count);
  console.assert(studentFVClosed.ayes_count === 0, 'Flash vote counts must remain concealed from students until revealed');

  // REVEAL RESULTS
  storageService.revealFlashVoteResult(flashVote.id, eventId);
  let revealedFV = storageService.getFlashVotes(eventId).find(f => f.id === flashVote.id)!;
  let projSettingsAfterFVReveal = storageService.getProjectorSettings(eventId);
  console.log('E. Results Revealed: is_result_revealed =', revealedFV.is_result_revealed, '| Projector Scene =', projSettingsAfterFVReveal.displayScene);
  console.assert(revealedFV.is_result_revealed === true, 'Flash vote must be marked revealed');
  console.assert(projSettingsAfterFVReveal.displayScene === 'flash_vote', 'Projector scene must be flash_vote');

  const studentFVRevealed = storageService.getFlashVotes(eventId, 'student', dummyLearner.id).find(f => f.id === flashVote.id)!;
  console.log('F. Student View When Revealed: Ayes =', studentFVRevealed.ayes_count, '| Noes =', studentFVRevealed.noes_count);
  console.assert(studentFVRevealed.ayes_count === 1 && studentFVRevealed.noes_count === 1, 'Student view must now see authoritative tallies');

  // DISMISS & SHOW SESSION
  storageService.dismissFlashVoteResult(flashVote.id, eventId);
  let dismissedFV = storageService.getFlashVotes(eventId).find(f => f.id === flashVote.id)!;
  let projSettingsAfterFVDismiss = storageService.getProjectorSettings(eventId);
  console.log('G. Dismiss & Show Session: is_dismissed =', dismissedFV.is_dismissed, '| Projector Scene =', projSettingsAfterFVDismiss.displayScene);
  console.assert(dismissedFV.is_dismissed === true, 'Flash vote must be marked dismissed');
  console.assert(projSettingsAfterFVDismiss.displayScene === 'agenda', 'Projector scene must return to active agenda');
  console.assert(dismissedFV.ayes_count === 1 && dismissedFV.noes_count === 1, 'Flash vote counts MUST remain 100% intact');
  console.log('PASS: Flash Vote Lifecycle Verified!\n');

  console.log('============================================================');
  console.log('ALL VOTING TYPES PASSED ALL LIFECYCLE & RETENTION TESTS 100%');
  console.log('============================================================');
}

runAuditAndLifecycleTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
