import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Election, LiveFlashVote, Learner, FlashVoteAudience, ElectionCandidate, Nomination, Party, LoginRecord, Committee, BillProceeding } from '../../types';
import {
  Vote,
  Plus,
  Trophy,
  Users,
  Zap,
  Play,
  RotateCcw,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Crown,
  Scale,
  Landmark,
  Layers,
  Check,
  Search,
  X,
  XCircle,
  AlertCircle,
  Lock,
  BarChart3,
  History,
  Trash2,
  Tv,
  Smartphone,
  Laptop,
  KeyRound,
  UserCheck,
  UserX,
  CheckCircle2,
  Download,
  Archive,
  ShieldAlert,
  ScrollText,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { getProjectorSettings, saveProjectorSettings } from './ProjectorTab';
import { storageService, getResolvedPartyName, deduplicateElectionList } from '../../services/storageService';

interface ElectionsTabProps {
  elections: Election[];
  flashVotes: LiveFlashVote[];
  learners: Learner[];
  parties?: Party[];
  committees?: Committee[];
  nominations?: Nomination[];
  eventId: string;
  onCastVote: (electionId: string, candidateId: string, delegateId?: string) => void;
  onCloseElection: (electionId: string) => void;
  onSetElectionStatus?: (electionId: string, status: 'Upcoming' | 'Live' | 'Closed') => void;
  onAddCandidate?: (electionId: string, candidate: Partial<ElectionCandidate>) => { success: boolean; reason?: string } | boolean | void;
  onRemoveCandidate?: (electionId: string, candidateId: string) => void;
  onResetElection?: (electionId: string) => void;
  onDeleteElection?: (electionId: string) => void;
  onCreateElection: (elec: Partial<Election>) => void;
  onCreateFlashVote: (eventId: string, question: string, audience: FlashVoteAudience, motionType: LiveFlashVote['motion_type']) => void;
  onCastFlashVote?: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onCloseFlashVote: (voteId: string) => void;
  onDeleteFlashVote?: (voteId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const CONSTITUTIONAL_POSTS = [
  {
    key: 'speaker',
    title: 'Assembly Speaker Election',
    position: 'Speaker',
    type: 'SPEAKER' as const,
    electorate: 'ALL' as const,
    electorateLabel: 'Whole House (All Delegates)',
    description: 'Whole House elects Speaker (Highest votes) & Deputy Speaker (2nd highest votes)',
    icon: Crown
  },
  {
    key: 'cm',
    title: 'Ruling Party Leader & Chief Minister Election',
    position: 'Ruling Party Leader',
    type: 'LEADERSHIP' as const,
    electorate: 'RULING' as const,
    electorateLabel: 'Ruling Bench Only',
    description: 'Ruling Bench delegates only',
    icon: Trophy
  },
  {
    key: 'lop',
    title: 'Leader of the Opposition (LOP) Election',
    position: 'Opposition Party Leader',
    type: 'LEADERSHIP' as const,
    electorate: 'OPPOSITION' as const,
    electorateLabel: 'Opposition Bench Only',
    description: 'Opposition Bench delegates only',
    icon: Scale
  }
];

export const ElectionsTab: React.FC<ElectionsTabProps> = ({
  elections,
  flashVotes,
  learners,
  parties = [],
  committees = [],
  nominations = [],
  eventId,
  onCastVote,
  onCloseElection,
  onSetElectionStatus,
  onAddCandidate,
  onRemoveCandidate,
  onResetElection,
  onDeleteElection,
  onCreateElection,
  onCreateFlashVote,
  onCloseFlashVote,
  onDeleteFlashVote,
  onShowToast
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'ELECTIONS' | 'BILLS' | 'FLASH_VOTES' | 'HISTORY' | 'TRASH'>('ELECTIONS');
  const [bills, setBills] = useState<BillProceeding[]>(() => storageService.getBills(eventId));
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [billTitle, setBillTitle] = useState('');
  const [billSummary, setBillSummary] = useState('');
  const [billProposer, setBillProposer] = useState('');
  const [billAgendaId, setBillAgendaId] = useState('');

  const [selectedHistoryElection, setSelectedHistoryElection] = useState<Election | null>(null);
  const [archivedElections, setArchivedElections] = useState<Election[]>(() => {
    return storageService.getArchivedElections(eventId);
  });
  const [deletingElection, setDeletingElection] = useState<Election | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  const [syncedFlashVotes, setSyncedFlashVotes] = useState<LiveFlashVote[]>(() => storageService.getFlashVotes(eventId));

  useEffect(() => {
    setSyncedFlashVotes(storageService.getFlashVotes(eventId));
  }, [flashVotes, eventId]);

  useEffect(() => {
    setArchivedElections(storageService.getArchivedElections(eventId));
    setBills(storageService.getBills(eventId));
    setSyncedFlashVotes(storageService.getFlashVotes(eventId));
    const unsub = storageService.subscribe(() => {
      setArchivedElections(storageService.getArchivedElections(eventId));
      setBills(storageService.getBills(eventId));
      setSyncedFlashVotes(storageService.getFlashVotes(eventId));
    });
    return () => unsub();
  }, [eventId]);

  const handleDeleteClick = (elec: Election) => {
    const totalVotes = elec.total_votes || (elec.candidates || []).reduce((sum, c) => sum + (c.votes || 0), 0);
    if (totalVotes > 0) {
      setDeletingElection(elec);
      setDeleteConfirmInput('');
    } else {
      if (window.confirm(`Archive "${elec.title}" to trash? You can restore it anytime from the Trash view.`)) {
        storageService.archiveElection(elec.id);
        if (onDeleteElection) onDeleteElection(elec.id);
        setArchivedElections(storageService.getArchivedElections(eventId));
        onShowToast('Ballot Archived', `Archived "${elec.title}" to trash.`, 'info');
      }
    }
  };

  const handleConfirmGuardDelete = () => {
    if (!deletingElection) return;
    if (deleteConfirmInput.trim() !== 'DELETE') {
      onShowToast('Confirmation Mismatch', 'Please type DELETE exactly to confirm archiving this ballot.', 'error');
      return;
    }
    storageService.archiveElection(deletingElection.id);
    if (onDeleteElection) onDeleteElection(deletingElection.id);
    setArchivedElections(storageService.getArchivedElections(eventId));
    onShowToast('Ballot Archived', `Archived "${deletingElection.title}" to trash.`, 'info');
    setDeletingElection(null);
    setDeleteConfirmInput('');
  };

  const handleRestoreElection = (elecId: string, title: string) => {
    storageService.restoreElection(elecId);
    setArchivedElections(storageService.getArchivedElections(eventId));
    onShowToast('Ballot Restored', `Restored "${title}" to active ballots.`, 'success');
  };
  
  const [expandedElectionIds, setExpandedElectionIds] = useState<Set<string>>(new Set());
  const [activeNominateElectionId, setActiveNominateElectionId] = useState<string | null>(null);
  const [nominationSourceTab, setNominationSourceTab] = useState<'NOMINATIONS' | 'ALL_DELEGATES'>('NOMINATIONS');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [submittingCandidateId, setSubmittingCandidateId] = useState<string | null>(null);
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollMotionType, setPollMotionType] = useState<LiveFlashVote['motion_type']>('Division');

  // Quick Launch Ballot Modal State
  const [isQuickLaunchModalOpen, setIsQuickLaunchModalOpen] = useState(false);
  const [quickBallotTitle, setQuickBallotTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<'Leadership' | 'Floor Division' | 'Committee Ballot' | 'Flash Vote'>('Leadership');
  const [selectedCandidateLearnerIds, setSelectedCandidateLearnerIds] = useState<string[]>([]);
  const [quickCandidateSearch, setQuickCandidateSearch] = useState('');
  const [quickEligibilityScope, setQuickEligibilityScope] = useState<'all' | 'party' | 'committee'>('all');
  const [quickEligibilityTargetId, setQuickEligibilityTargetId] = useState<string>('');

  const eventCommittees = useMemo(() => {
    return committees && committees.length > 0 ? committees : storageService.getCommittees(eventId);
  }, [committees, eventId]);

  useEffect(() => {
    if (quickEligibilityScope === 'party' && !quickEligibilityTargetId && parties.length > 0) {
      setQuickEligibilityTargetId(parties[0].id);
    } else if (quickEligibilityScope === 'committee' && !quickEligibilityTargetId && eventCommittees.length > 0) {
      setQuickEligibilityTargetId(eventCommittees[0].id);
    }
  }, [quickEligibilityScope, parties, eventCommittees, quickEligibilityTargetId]);

  const resetQuickLaunchModal = () => {
    setIsQuickLaunchModalOpen(false);
    setQuickBallotTitle('');
    setQuickCategory('Leadership');
    setSelectedCandidateLearnerIds([]);
    setQuickCandidateSearch('');
    setQuickEligibilityScope('all');
    setQuickEligibilityTargetId('');
  };

  const handleLaunchQuickBallot = (isLive: boolean) => {
    if (!quickBallotTitle.trim()) {
      onShowToast('Missing Ballot Title', 'Please provide a title for the ballot.', 'error');
      return;
    }
    if (selectedCandidateLearnerIds.length < 2) {
      onShowToast('Nominees Required', 'Please select at least 2 delegates as candidate options.', 'error');
      return;
    }

    const candidateObjects: ElectionCandidate[] = selectedCandidateLearnerIds.map(learnerId => {
      const learner = learners.find(l => l.id === learnerId);
      return {
        id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        learner_id: learnerId,
        learnerId: learnerId,
        name: learner?.full_name || 'Unknown Candidate',
        party: learner?.party_name || 'Independent',
        bench: learner?.bench || 'Ruling',
        constituency: learner?.constituency_name || '',
        votes: 0
      };
    });

    let targetName: string | undefined = undefined;
    if (quickEligibilityScope === 'party') {
      targetName = parties.find(p => p.id === quickEligibilityTargetId)?.name || quickEligibilityTargetId;
    } else if (quickEligibilityScope === 'committee') {
      targetName = eventCommittees.find(c => c.id === quickEligibilityTargetId)?.name || quickEligibilityTargetId;
    }

    const ballotId = `quick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newElection: Partial<Election> = {
      id: ballotId,
      event_id: eventId,
      eventId: eventId,
      title: quickBallotTitle.trim(),
      position: quickCategory === 'Leadership' ? 'Leadership Role' : quickCategory === 'Committee Ballot' ? 'Committee Chairperson' : 'Floor Division',
      type: quickCategory === 'Committee Ballot' ? 'COMMITTEE' : 'LEADERSHIP',
      category: quickCategory,
      status: isLive ? 'Live' : 'Upcoming',
      candidates: candidateObjects,
      total_votes: 0,
      voted_delegate_ids: [],
      votedLearnerIds: [],
      eligibility: {
        scope: quickEligibilityScope,
        targetId: quickEligibilityScope === 'all' ? undefined : quickEligibilityTargetId,
        targetName
      },
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    onCreateElection(newElection);

    if (isLive) {
      storageService.broadcast('election_update', {
        eventId,
        elections: storageService.getElections(eventId)
      });
      onShowToast(
        '🚀 Quick Ballot Launched Live!',
        `"${newElection.title}" is now open for voting by ${quickEligibilityScope === 'all' ? 'all House delegates' : (targetName || 'eligible delegates')}.`,
        'success'
      );
    } else {
      onShowToast(
        'Ballot Saved as Draft',
        `"${newElection.title}" saved. You can start live voting whenever ready.`,
        'info'
      );
    }

    resetQuickLaunchModal();
  };

  // Login records (for student device status in voter lists)
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>(() => storageService.getLoginRecords(eventId));

  // Per-election Floor Ballot & Voter Console State
  const [voterConsoleTab, setVoterConsoleTab] = useState<Record<string, 'NON_VOTED' | 'VOTED' | 'QUICK_BALLOT'>>({});
  const [voterSearch, setVoterSearch] = useState<Record<string, string>>({});
  const [voterBenchFilter, setVoterBenchFilter] = useState<Record<string, 'ALL' | 'RULING' | 'OPPOSITION'>>({});
  const [voterDeviceFilter, setVoterDeviceFilter] = useState<Record<string, 'ALL' | 'LOGGED_IN' | 'NO_DEVICE'>>({});
  const [proxyVotingLearnerId, setProxyVotingLearnerId] = useState<Record<string, string | null>>({});
  const [quickScanCode, setQuickScanCode] = useState<Record<string, string>>({});

  // Reveal stages for closed elections: 'ready' (Reveal Result) -> 'revealed' (Close Reveal Result) -> 'done' (Done state)
  const [revealStages, setRevealStages] = useState<Record<string, 'ready' | 'revealed' | 'done'>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem(`tn_assembly_election_reveal_stage_${eventId}`) || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });

  const updateRevealStage = (elecId: string, stage: 'ready' | 'revealed' | 'done') => {
    setRevealStages(prev => {
      const next = { ...prev, [elecId]: stage };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`tn_assembly_election_reveal_stage_${eventId}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Real-time login records refresh (event-driven via storageService.subscribe)
  useEffect(() => {
    setLoginRecords(storageService.getLoginRecords(eventId));
    const unsub = storageService.subscribe(() => {
      setLoginRecords(storageService.getLoginRecords(eventId));
    });
    return () => unsub();
  }, [eventId]);

  // Map student IDs and access codes to their most recent login record
  const studentLoginMap = useMemo(() => {
    const map = new Map<string, LoginRecord>();
    loginRecords.forEach(r => {
      if (r.role === 'student') {
        if (!map.has(r.user_id)) {
          map.set(r.user_id, r);
        }
        if (r.access_code && !map.has(r.access_code.toUpperCase())) {
          map.set(r.access_code.toUpperCase(), r);
        }
      }
    });
    return map;
  }, [loginRecords]);

  const isAutoCreatingRef = useRef(false);

  // Auto-create standard constitutional election rows & party leader elections if missing
  useEffect(() => {
    if (!eventId || isAutoCreatingRef.current) return;

    const deduplicated = deduplicateElectionList(elections, parties);
    const toCreate: Partial<Election>[] = [];

    CONSTITUTIONAL_POSTS.forEach(post => {
      const exists = deduplicated.some(e =>
        e.position?.toLowerCase() === post.position.toLowerCase() ||
        e.title?.toLowerCase() === post.title.toLowerCase()
      );
      if (!exists) {
        toCreate.push({
          event_id: eventId,
          title: post.title,
          position: post.position,
          type: post.type,
          status: 'Upcoming',
          candidates: [],
          total_votes: 0,
          voted_delegate_ids: []
        });
      }
    });

    // Auto-create Party Leader Elections for all assigned parties
    if (parties && parties.length > 0) {
      parties.forEach(p => {
        const exists = deduplicated.some(e =>
          (e.party_id && e.party_id === p.id) ||
          (p.name && e.title.toLowerCase().includes(p.name.toLowerCase()) &&
           (e.title.toLowerCase().includes('leader') || e.position?.toLowerCase().includes('leader')))
        );
        if (!exists) {
          toCreate.push({
            event_id: eventId,
            party_id: p.id,
            title: `${p.name} Leader Election`,
            position: 'Party Leader',
            type: 'LEADERSHIP',
            status: 'Upcoming',
            candidates: [],
            total_votes: 0,
            voted_delegate_ids: []
          });
        }
      });
    }

    if (toCreate.length > 0) {
      isAutoCreatingRef.current = true;
      toCreate.forEach(elec => {
        onCreateElection(elec);
      });
      setTimeout(() => {
        isAutoCreatingRef.current = false;
      }, 800);
    }
  }, [elections, eventId, parties]);

  const toggleAccordion = (id: string) => {
    setExpandedElectionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getElectorateRule = (election: Election): { type: 'ALL' | 'RULING' | 'OPPOSITION' | 'PARTY' | 'COMMITTEE'; partyId?: string; partyName?: string; committeeId?: string; committeeName?: string; label: string } => {
    if (election.eligibility) {
      if (election.eligibility.scope === 'all') {
        return { type: 'ALL', label: 'Whole Assembly (All Delegates)' };
      }
      if (election.eligibility.scope === 'party') {
        const pName = election.eligibility.targetName || parties.find(p => p.id === election.eligibility?.targetId)?.name || 'Party';
        return { type: 'PARTY', partyId: election.eligibility.targetId, partyName: pName, label: `${pName} Members Only` };
      }
      if (election.eligibility.scope === 'committee') {
        const cName = election.eligibility.targetName || eventCommittees.find(c => c.id === election.eligibility?.targetId)?.name || 'Committee';
        return { type: 'COMMITTEE', committeeId: election.eligibility.targetId, committeeName: cName, label: `${cName} Members Only` };
      }
    }

    const partyLeaderParty = getPartyLeaderElectionParty(election);
    if (partyLeaderParty) {
      return { type: 'PARTY', partyId: partyLeaderParty.id, partyName: partyLeaderParty.name, label: `${partyLeaderParty.name} Members Only` };
    }

    const title = (election.title || '').toLowerCase();
    const pos = (election.position || '').toLowerCase();

    if (pos.includes('opposition') || title.includes('opposition') || title.includes('lop')) {
      return { type: 'OPPOSITION', label: 'Opposition Bench Only' };
    }
    if (pos.includes('ruling') || title.includes('ruling') || title.includes('chief minister') || title.includes('prime minister')) {
      return { type: 'RULING', label: 'Ruling Bench Only' };
    }
    return { type: 'ALL', label: 'Whole Assembly (All Delegates)' };
  };

  const isDelegateEligibleForElection = (voter: Learner | null, election: Election): boolean => {
    if (!voter) return false;
    if (election.eligibility) {
      if (election.eligibility.scope === 'all') return true;
      if (election.eligibility.scope === 'party') {
        return voter.party_id === election.eligibility.targetId ||
          (!!election.eligibility.targetName && voter.party_name?.toLowerCase() === election.eligibility.targetName.toLowerCase());
      }
      if (election.eligibility.scope === 'committee') {
        return (voter as any).committee_id === election.eligibility.targetId ||
          (!!election.eligibility.targetName && (voter as any).committee_name?.toLowerCase() === election.eligibility.targetName.toLowerCase());
      }
    }

    const rule = getElectorateRule(election);

    if (rule.type === 'PARTY') {
      if (rule.partyId && voter.party_id !== rule.partyId && voter.party_name?.toLowerCase() !== rule.partyName?.toLowerCase()) {
        return false;
      }
    } else if (rule.type === 'COMMITTEE') {
      if (rule.committeeId && (voter as any).committee_id !== rule.committeeId && (voter as any).committee_name?.toLowerCase() !== rule.committeeName?.toLowerCase()) {
        return false;
      }
    } else if (rule.type === 'OPPOSITION' && voter.bench !== 'Opposition') {
      return false;
    } else if (rule.type === 'RULING' && voter.bench !== 'Ruling') {
      return false;
    }

    return true;
  };

  const checkVoterEligibility = (voter: Learner | null, election: Election): { eligible: boolean; reason?: string } => {
    if (!voter) return { eligible: false, reason: 'No voter selected' };
    if (election.eligibility) {
      if (election.eligibility.scope === 'party') {
        const matchesParty = voter.party_id === election.eligibility.targetId ||
          (!!election.eligibility.targetName && voter.party_name?.toLowerCase() === election.eligibility.targetName.toLowerCase());
        if (!matchesParty) {
          return { eligible: false, reason: `Active Ballot in Progress: Restricted to ${election.eligibility.targetName || 'the assigned political party'}. Your bench is not participating in this vote.` };
        }
      } else if (election.eligibility.scope === 'committee') {
        const matchesComm = (voter as any).committee_id === election.eligibility.targetId ||
          (!!election.eligibility.targetName && (voter as any).committee_name?.toLowerCase() === election.eligibility.targetName.toLowerCase());
        if (!matchesComm) {
          return { eligible: false, reason: `Active Ballot in Progress: Restricted to ${election.eligibility.targetName || 'the assigned committee'}. Your bench is not participating in this vote.` };
        }
      }
    }

    const rule = getElectorateRule(election);

    if (rule.type === 'PARTY') {
      if (rule.partyId && voter.party_id !== rule.partyId && voter.party_name?.toLowerCase() !== rule.partyName?.toLowerCase()) {
        return { eligible: false, reason: `This election is restricted to ${rule.partyName || 'Party'} delegates only.` };
      }
    } else if (rule.type === 'COMMITTEE') {
      if (rule.committeeId && (voter as any).committee_id !== rule.committeeId && (voter as any).committee_name?.toLowerCase() !== rule.committeeName?.toLowerCase()) {
        return { eligible: false, reason: `This ballot is restricted to ${rule.committeeName || 'Committee'} members only.` };
      }
    } else if (rule.type === 'OPPOSITION' && voter.bench !== 'Opposition') {
      return { eligible: false, reason: 'Restricted to Opposition Bench delegates only.' };
    } else if (rule.type === 'RULING' && voter.bench !== 'Ruling') {
      return { eligible: false, reason: 'Restricted to Ruling Bench delegates only.' };
    }

    const hasVoted = election.voted_delegate_ids?.includes(voter.id) || (election as any).votedLearnerIds?.includes(voter.id);
    if (hasVoted) {
      return { eligible: false, reason: `${voter.full_name} has already voted in this election.` };
    }

    return { eligible: true };
  };

  const { constitutionalElections, partyLeaderElections, customElections } = useMemo(() => {
    const deduplicated = deduplicateElectionList(elections, parties);
    const constitutional: Election[] = [];
    const partyLeaders: Election[] = [];
    const custom: Election[] = [];

    deduplicated.forEach(elec => {
      const title = (elec.title || '').toLowerCase();
      const pos = (elec.position || '').toLowerCase();

      // Deputy Speaker is not a separate election; 2nd highest in Speaker election is Deputy Speaker
      if (title.includes('deputy') || pos.includes('deputy') || elec.type === 'DEPUTY_SPEAKER') {
        return;
      }

      if ((title.includes('party leader') && !title.includes('ruling') && !title.includes('opposition')) || (pos === 'party leader')) {
        partyLeaders.push(elec);
      } else if (
        pos.includes('speaker') || pos.includes('ruling') || pos.includes('opposition') ||
        title.includes('speaker') || title.includes('chief minister') || title.includes('prime minister') || title.includes('leader of opposition')
      ) {
        constitutional.push(elec);
      } else {
        custom.push(elec);
      }
    });

    const getConstitutionalOrder = (e: Election) => {
      const text = ((e.title || '') + ' ' + (e.position || '')).toLowerCase();
      if (text.includes('deputy')) return 2;
      if (text.includes('speaker')) return 1;
      if (text.includes('chief minister') || text.includes('ruling') || text.includes('prime minister')) return 3;
      if (text.includes('opposition') || text.includes('lop')) return 4;
      return 99;
    };
    constitutional.sort((a, b) => getConstitutionalOrder(a) - getConstitutionalOrder(b));

    partyLeaders.sort((a, b) => {
      const pIndexA = parties.findIndex(p => (p.id && p.id === a.party_id) || a.title.toLowerCase().includes(p.name.toLowerCase()));
      const pIndexB = parties.findIndex(p => (p.id && p.id === b.party_id) || b.title.toLowerCase().includes(p.name.toLowerCase()));

      if (pIndexA !== -1 && pIndexB !== -1 && pIndexA !== pIndexB) {
        return pIndexA - pIndexB;
      }

      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });

    return { constitutionalElections: constitutional, partyLeaderElections: partyLeaders, customElections: custom };
  }, [elections, parties]);

  const closedElections = useMemo(() => {
    return elections.filter(e => e.status === 'Closed' || e.winner !== undefined);
  }, [elections]);

  const getPartyLeaderElectionParty = (election: Election | null): Party | null => {
    if (!election) return null;
    if (election.party_id) {
      const match = parties.find(p => p.id === election.party_id);
      if (match) return match;
    }
    const title = (election.title || '').toLowerCase();
    const pos = (election.position || '').toLowerCase();
    if ((pos === 'party leader' || title.includes('party leader')) && !title.includes('ruling') && !title.includes('opposition')) {
      const match = parties.find(p => p.name && (title.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(title.replace('leader election', '').trim())));
      if (match) return match;

      // Fallback: extract party name from title e.g. "Party 1 Leader Election" -> "Party 1"
      const extracted = (election.title || '').replace(/\s+leader election$/i, '').trim();
      if (extracted && extracted.toLowerCase() !== 'party') {
        return {
          id: election.party_id || '',
          event_id: election.event_id,
          name: extracted,
          bench: 'Independent',
          color: '#059669'
        };
      }
    }
    return null;
  };

  const activeElectionForNominate = useMemo(() => {
    return elections.find(e => e.id === activeNominateElectionId) || null;
  }, [elections, activeNominateElectionId]);

  const activePartyLeaderParty = useMemo(() => {
    return getPartyLeaderElectionParty(activeElectionForNominate);
  }, [activeElectionForNominate, parties]);



  const relevantStudentNominations = useMemo(() => {
    if (!activeElectionForNominate) return [];
    const targetPos = (activeElectionForNominate.position || activeElectionForNominate.title).toLowerCase();
    return nominations.filter(n => {
      if (activePartyLeaderParty) {
        const matchLearner = learners.find(l => l.id === n.candidate_learner_id || l.full_name?.toLowerCase() === n.candidate_name?.toLowerCase());
        const targetPartyId = activePartyLeaderParty.id?.trim();
        const targetPartyName = activePartyLeaderParty.name?.trim().toLowerCase();
        const resolvedName = matchLearner ? getResolvedPartyName(matchLearner, parties).trim().toLowerCase() : (n.party_name?.trim().toLowerCase() || '');
        const matchesId = Boolean(targetPartyId && matchLearner?.party_id && matchLearner.party_id === targetPartyId);
        const matchesName = Boolean(targetPartyName && resolvedName && resolvedName === targetPartyName);

        if (!matchesId && !matchesName) return false;
      }

      const nPos = n.position.toLowerCase();
      if (targetPos.includes('speaker') && !targetPos.includes('deputy') && nPos.includes('speaker') && !nPos.includes('deputy')) return true;
      if (targetPos.includes('deputy') && nPos.includes('deputy')) return true;
      if ((targetPos.includes('ruling') || targetPos.includes('chief minister') || targetPos.includes('prime minister')) && (nPos.includes('ruling') || nPos.includes('chief minister') || nPos.includes('prime minister'))) return true;
      if ((targetPos.includes('opposition') || targetPos.includes('lop')) && (nPos.includes('opposition') || nPos.includes('leader of opposition'))) return true;
      if (targetPos.includes('party leader') && nPos.includes('party leader')) return true;
      if (nPos === targetPos) return true;
      return false;
    });
  }, [nominations, activeElectionForNominate, activePartyLeaderParty, learners, parties]);

  const filteredCandidatePool = useMemo(() => {
    if (!activeElectionForNominate) return [];
    let pool = learners;

    if (activePartyLeaderParty) {
      const targetPartyId = activePartyLeaderParty.id?.trim();
      const targetPartyName = activePartyLeaderParty.name?.trim().toLowerCase();
      pool = pool.filter(l => {
        const resolvedName = getResolvedPartyName(l, parties).trim().toLowerCase();
        const matchesId = Boolean(targetPartyId && l.party_id && l.party_id === targetPartyId);
        const matchesName = Boolean(targetPartyName && resolvedName && resolvedName === targetPartyName);
        const matchesDirectName = Boolean(targetPartyName && l.party_name && l.party_name.trim().toLowerCase() === targetPartyName);
        return matchesId || matchesName || matchesDirectName;
      });
    } else {
      const rule = getElectorateRule(activeElectionForNominate);
      if (rule.type === 'PARTY' && (rule.partyId || rule.partyName)) {
        const targetPartyId = rule.partyId?.trim();
        const targetPartyName = rule.partyName?.trim().toLowerCase();
        pool = pool.filter(l => {
          const resolvedName = getResolvedPartyName(l, parties).trim().toLowerCase();
          const matchesId = Boolean(targetPartyId && l.party_id && l.party_id === targetPartyId);
          const matchesName = Boolean(targetPartyName && resolvedName && resolvedName === targetPartyName);
          const matchesDirectName = Boolean(targetPartyName && l.party_name && l.party_name.trim().toLowerCase() === targetPartyName);
          return matchesId || matchesName || matchesDirectName;
        });
      } else if (rule.type === 'OPPOSITION') {
        pool = pool.filter(l => l.bench === 'Opposition');
      } else if (rule.type === 'RULING') {
        pool = pool.filter(l => l.bench === 'Ruling');
      }
    }

    if (candidateSearchQuery.trim()) {
      const q = candidateSearchQuery.toLowerCase();
      const cleanQ = q.replace(/^[#\s]+/, '').trim();

      pool = pool.filter(l => {
        const constNumStr = l.constituency_number !== undefined && l.constituency_number !== null ? String(l.constituency_number) : '';
        const constWithHash = constNumStr ? `#${constNumStr}` : '';
        const matchesConstNo = Boolean(
          constNumStr && (
            constNumStr === q ||
            constNumStr === cleanQ ||
            constNumStr.includes(cleanQ) ||
            constWithHash.toLowerCase().includes(q)
          )
        );

        return (
          l.full_name?.toLowerCase().includes(q) ||
          getResolvedPartyName(l, parties).toLowerCase().includes(q) ||
          l.party_name?.toLowerCase().includes(q) ||
          l.constituency_name?.toLowerCase().includes(q) ||
          matchesConstNo
        );
      });
    }

    return pool;
  }, [learners, activeElectionForNominate, activePartyLeaderParty, candidateSearchQuery, parties]);

  const handleAddCandidateToElection = (learner: Learner, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!activeElectionForNominate || !onAddCandidate) return;
    if (submittingCandidateId === learner.id) return;

    if (activePartyLeaderParty) {
      const targetPartyId = activePartyLeaderParty.id?.trim();
      const targetPartyName = activePartyLeaderParty.name?.trim().toLowerCase();
      const resolvedName = getResolvedPartyName(learner, parties).trim().toLowerCase();
      const matchesId = Boolean(targetPartyId && learner.party_id && learner.party_id === targetPartyId);
      const matchesName = Boolean(targetPartyName && resolvedName && resolvedName === targetPartyName);
      const matchesDirectName = Boolean(targetPartyName && learner.party_name && learner.party_name.trim().toLowerCase() === targetPartyName);

      if (!matchesId && !matchesName && !matchesDirectName) {
        onShowToast('Ineligible Candidate', `${learner.full_name} cannot be added — not a registered member of ${activePartyLeaderParty.name}.`, 'error');
        return;
      }
    }

    const alreadyIn = activeElectionForNominate.candidates?.some(
      c => (c.learner_id && c.learner_id === learner.id) || c.name.toLowerCase() === learner.full_name.toLowerCase()
    );
    if (alreadyIn) {
      onShowToast('Candidate Exists', `${learner.full_name} is already nominated for this election.`, 'error');
      return;
    }

    try {
      setSubmittingCandidateId(learner.id);
      const resolvedParty = getResolvedPartyName(learner, parties) || learner.party_name || activePartyLeaderParty?.name || 'Independent';
      const result = onAddCandidate(activeElectionForNominate.id, {
        name: learner.full_name,
        learner_id: learner.id,
        party: resolvedParty,
        bench: learner.bench || activePartyLeaderParty?.bench || 'Ruling',
        votes: 0
      });

      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.success) {
          onShowToast('Nomination Rejected', result.reason || `${learner.full_name} cannot be added to this ballot.`, 'error');
          return;
        }
      } else if (result === false) {
        onShowToast('Nomination Rejected', `${learner.full_name} cannot be added to this ballot.`, 'error');
        return;
      }

      onShowToast('Candidate Nominated', `${learner.full_name} was added to the ballot.`, 'success');
    } finally {
      setTimeout(() => {
        setSubmittingCandidateId(null);
      }, 400);
    }
  };

  const handleProjectResult = (electionId: string, title: string) => {
    updateRevealStage(electionId, 'revealed');
    try {
      const cur = getProjectorSettings(eventId);
      saveProjectorSettings({
        ...cur,
        displayScene: 'election_result',
        revealedElectionId: electionId
      }, eventId);
      onShowToast('Projected on Display', `Broadcasting animated result declaration for "${title}" to stage screen.`, 'success');
    } catch {
      onShowToast('Projector Sync', `Updated stage display with results for "${title}"`, 'info');
    }
  };

  const handleProjectLiveElection = (electionId: string, title: string) => {
    try {
      const cur = getProjectorSettings(eventId);
      saveProjectorSettings({
        ...cur,
        displayScene: 'election',
        revealedElectionId: electionId
      }, eventId);
      onShowToast('Live Voting Projected', `Broadcasting live ballot progress for "${title}" to stage screen.`, 'info');
    } catch {
      onShowToast('Projector Sync', `Updated stage display with live voting for "${title}"`, 'info');
    }
  };

  const handleCloseElection = (electionId: string, title: string) => {
    onCloseElection(electionId);
    updateRevealStage(electionId, 'ready');
    try {
      const cur = getProjectorSettings(eventId);
      saveProjectorSettings({
        ...cur,
        displayScene: 'election',
        revealedElectionId: electionId
      }, eventId);
      onShowToast('Voting Closed', `Ballot for "${title}" is sealed. Click "Reveal Result on Projector" to announce winner.`, 'info');
    } catch {
      onShowToast('Voting Closed', `Ballot closed for "${title}"`, 'info');
    }
  };

  const handleCloseRevealResult = (electionId?: string) => {
    if (electionId) {
      updateRevealStage(electionId, 'done');
    } else {
      setRevealStages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (next[k] === 'revealed') next[k] = 'done';
        });
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`tn_assembly_election_reveal_stage_${eventId}`, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    }
    try {
      const cur = getProjectorSettings(eventId);
      saveProjectorSettings({
        ...cur,
        displayScene: 'auto',
        revealedElectionId: undefined
      }, eventId);
      onShowToast('Stage Screen Reset', 'Closed result reveal and returned stage display to active agenda', 'info');
    } catch {
      onShowToast('Stage Reset', 'Returned stage display to active agenda', 'info');
    }
  };

  const renderElectionRow = (elec: Election, index: number) => {
    const isExpanded = expandedElectionIds.has(elec.id);
    const isLive = elec.status === 'Live';
    const isClosed = elec.status === 'Closed';
    const isUpcoming = elec.status === 'Upcoming' || !elec.status;
    const sortedCandidates = [...(elec.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const leader = sortedCandidates.length > 0 && sortedCandidates[0].votes > 0 ? sortedCandidates[0] : null;
    const rule = getElectorateRule(elec);
    const eligibleLearners = learners.filter(l => isDelegateEligibleForElection(l, elec));
    const totalEligible = eligibleLearners.length;

    const liveVotedCount = elec.voted_delegate_ids?.length || 0;
    const liveTurnoutPct = totalEligible > 0 ? Math.round((liveVotedCount / totalEligible) * 100) : 0;
    const liveRemainingCount = Math.max(0, totalEligible - liveVotedCount);

    const currentProjector = getProjectorSettings(eventId);
    const isProjectorRevealingThis = currentProjector?.displayScene === 'election_result' && currentProjector?.revealedElectionId === elec.id;
    const effectiveRevealStage: 'ready' | 'revealed' | 'done' = isProjectorRevealingThis
      ? 'revealed'
      : (revealStages[elec.id] || (elec.completed_at ? 'done' : 'ready'));

    return (
      <div
        key={elec.id}
        className="rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:border-slate-400 dark:hover:border-slate-500"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
      >
        {/* Accordion Row Header (Compact & sleek UI) */}
        <div
          onClick={() => toggleAccordion(elec.id)}
          className="py-2.5 px-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-500/5 transition-colors select-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Chevron toggle */}
            <div className="text-slate-400 shrink-0">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>

            {/* Status Circle Indicator */}
            {isClosed ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            ) : isLive ? (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center justify-center text-xs font-semibold shrink-0">
                {index + 1}
              </div>
            )}

            {/* Election Icon + Title */}
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="text-amber-500 shrink-0">
                <Crown className="w-4 h-4" />
              </span>
              <span className="font-semibold text-sm sm:text-base tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {elec.title}
              </span>
              {elec.category && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {elec.category}
                </span>
              )}
              {elec.eligibility && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {elec.eligibility.scope === 'all'
                    ? 'All Delegates'
                    : elec.eligibility.scope === 'party'
                    ? `Party: ${elec.eligibility.targetName || 'Restricted'}`
                    : `Committee: ${elec.eligibility.targetName || 'Restricted'}`}
                </span>
              )}
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isClosed ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Done
              </span>
            ) : isLive ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                Live Voting
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                Not started
              </span>
            )}
          </div>
        </div>

        {/* Accordion Content when Expanded */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 border-t space-y-4" style={{ borderColor: 'var(--border-soft)', backgroundColor: 'var(--bg-elevated)' }}>
            {/* Action Bar / Electorate Rule & Status Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Electorate:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {rule.label}
                  </span>
                  <span className="text-[11px] text-slate-400">• Total Votes: <strong>{elec.total_votes || 0}</strong></span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {rule.type === 'OPPOSITION' && 'Only Opposition Bench delegates are permitted to vote.'}
                  {rule.type === 'RULING' && 'Only Ruling Bench delegates are permitted to vote.'}
                  {rule.type === 'PARTY' && `Only members of ${rule.partyName || 'the party'} are permitted to vote.`}
                  {rule.type === 'ALL' && 'All delegates across the House are eligible to participate.'}
                </p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {isUpcoming && (
                  <button
                    onClick={() => {
                      if (onSetElectionStatus) onSetElectionStatus(elec.id, 'Live');
                      handleProjectLiveElection(elec.id, elec.title);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Live Voting
                  </button>
                )}

                {isLive && (
                  <>
                    <button
                      onClick={() => handleCloseElection(elec.id, elec.title)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trophy className="w-3.5 h-3.5" /> End Voting & Close Ballot
                    </button>
                    <button
                      onClick={() => handleProjectLiveElection(elec.id, elec.title)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Tv className="w-3.5 h-3.5 text-amber-400" /> Project Live Ballot 📡
                    </button>
                  </>
                )}

                {isClosed && (
                  <>
                    {effectiveRevealStage === 'ready' && (
                      <button
                        onClick={() => handleProjectResult(elec.id, elec.title)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        title="Project animated winner declaration on auditorium display"
                      >
                        <Tv className="w-3.5 h-3.5 text-slate-950" /> Reveal Result on Projector 🎬
                      </button>
                    )}

                    {effectiveRevealStage === 'revealed' && (
                      <button
                        onClick={() => handleCloseRevealResult(elec.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        title="Close result reveal and return stage screen to normal active agenda display"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Close Reveal Result ✖
                      </button>
                    )}

                    {effectiveRevealStage === 'done' && (
                      <button
                        onClick={() => handleProjectResult(elec.id, elec.title)}
                        className="px-3 py-1 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        title="Result declared and finalized. Click to re-reveal results on stage screen."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Done
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(`Reset ballot for "${elec.title}"? This will clear all cast votes and reset the election to Upcoming.`)) {
                          updateRevealStage(elec.id, 'ready');
                          if (onResetElection) onResetElection(elec.id);
                          onShowToast('Ballot Reset', `Reset votes for "${elec.title}".`, 'info');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 flex items-center gap-1 cursor-pointer transition-all"
                      title="Reset Ballot and clear all cast votes"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Ballot
                    </button>
                  </>
                )}

                {!CONSTITUTIONAL_POSTS.some(p => p.position === elec.position || p.type === elec.type) && (
                  <button
                    onClick={() => handleDeleteClick(elec)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-all"
                    title="Archive Election Ballot to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Live Voter Progress Bar */}
            {isLive && (
              <div className="p-3.5 rounded-xl border space-y-2 bg-amber-500/10 border-amber-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 animate-pulse text-amber-500" /> Live Voter Progress
                  </span>
                  <span className="font-mono font-bold text-white">
                    {liveVotedCount} / {totalEligible} voted ({liveTurnoutPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${liveTurnoutPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {liveVotedCount} Voted
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> {liveRemainingCount} Remaining
                  </span>
                </div>
              </div>
            )}

            {/* Winner Banner if Closed */}
            {isClosed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 block">
                        {(elec.type === 'SPEAKER' || elec.position === 'Speaker') ? 'Elected Assembly Speaker (1st Highest)' : 'Elected Winner'}
                      </span>
                      <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {elec.winner || (leader ? leader.name : 'No winner declared')}
                      </h4>
                      {leader && (
                        <p className="text-[11px] text-slate-400">
                          Won with {leader.votes} votes ({elec.total_votes > 0 ? Math.round((leader.votes / elec.total_votes) * 100) : 0}%) • {leader.party}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {(elec.type === 'SPEAKER' || elec.position === 'Speaker') && sortedCandidates.length > 1 && sortedCandidates[1].votes > 0 && (
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-black">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block">
                          Designated Deputy Speaker (2nd Highest)
                        </span>
                        <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                          {sortedCandidates[1].name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {sortedCandidates[1].votes} votes ({elec.total_votes > 0 ? Math.round((sortedCandidates[1].votes / elec.total_votes) * 100) : 0}%) • {sortedCandidates[1].party}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nominated Candidates Roster */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-soft)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ballot Candidates ({elec.candidates?.length || 0})
                </span>
                {!isClosed && !isLive ? (
                  <button
                    onClick={() => {
                      setActiveNominateElectionId(elec.id);
                      setCandidateSearchQuery('');
                      setNominationSourceTab('NOMINATIONS');
                    }}
                    className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Nominate Candidate
                  </button>
                ) : isLive ? (
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Nominations Locked (Voting is live)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                    <Lock className="w-3 h-3" /> Nominations Closed
                  </span>
                )}
              </div>

              {(!elec.candidates || elec.candidates.length === 0) ? (
                <div className="p-4 rounded-lg border border-dashed text-center text-xs italic" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
                  No candidates nominated yet. Click <strong>"+ Nominate Candidate"</strong> to select from student nominations or the delegate directory.
                </div>
              ) : (
                <div className="space-y-2">
                  {elec.candidates.map((cand) => {
                    const pct = elec.total_votes > 0 ? Math.round(((cand.votes || 0) / elec.total_votes) * 100) : 0;
                    const isWinner = isClosed && (elec.winner === cand.name || leader?.id === cand.id);

                    return (
                      <div
                        key={cand.id}
                        className={`p-3 rounded-xl border space-y-2 transition-all ${
                          isWinner
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                            : ''
                        }`}
                        style={{
                          backgroundColor: isWinner ? undefined : 'var(--bg-elevated)',
                          borderColor: isWinner ? undefined : 'var(--border)'
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{cand.name}</span>
                              {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{cand.party}</span> • <span className={`font-semibold ${cand.bench === 'Ruling' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{cand.bench} Bench</span>
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                              {cand.votes || 0} <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                            </div>
                            {!isClosed && !isLive && onRemoveCandidate && (
                              <button
                                onClick={() => onRemoveCandidate(elec.id, cand.id)}
                                className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                          <div
                            className={`h-full transition-all duration-500 ${
                              cand.bench === 'Ruling' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FLOOR BALLOT & VOTER TURNOUT CONSOLE (Live and Post-Voting Review) */}
            {(isLive || isClosed) && (() => {
              const votedSet = new Set(elec.voted_delegate_ids || []);
              // Strictly limit to delegates who are eligible for this specific election
              const votedLearners = eligibleLearners.filter(l => votedSet.has(l.id));
              const nonVotedLearners = eligibleLearners.filter(l => !votedSet.has(l.id));

              const activeConsoleTab = voterConsoleTab[elec.id] || 'NON_VOTED';
              const currentQ = (voterSearch[elec.id] || '').trim().toLowerCase();
              const currentBenchF = voterBenchFilter[elec.id] || 'ALL';
              const currentDevF = voterDeviceFilter[elec.id] || 'ALL';

              const filterLearnerList = (list: Learner[]) => {
                return list.filter(l => {
                  if (currentBenchF === 'RULING' && l.bench !== 'Ruling') return false;
                  if (currentBenchF === 'OPPOSITION' && l.bench !== 'Opposition') return false;

                  const hasDev = studentLoginMap.has(l.id) || studentLoginMap.has((l.access_code || '').toUpperCase());
                  if (currentDevF === 'LOGGED_IN' && !hasDev) return false;
                  if (currentDevF === 'NO_DEVICE' && hasDev) return false;

                  if (currentQ) {
                    const matchName = (l.full_name || '').toLowerCase().includes(currentQ);
                    const matchCode = (l.access_code || '').toLowerCase().includes(currentQ);
                    const matchParty = (l.party_name || '').toLowerCase().includes(currentQ);
                    const matchConst = (l.constituency_name || '').toLowerCase().includes(currentQ) ||
                      (l.constituency_number !== undefined && String(l.constituency_number).includes(currentQ));
                    if (!matchName && !matchCode && !matchParty && !matchConst) return false;
                  }
                  return true;
                });
              };

              const filteredNonVoted = filterLearnerList(nonVotedLearners);
              const filteredVoted = filterLearnerList(votedLearners);

              // Quick code search match
              const scanCode = (quickScanCode[elec.id] || '').trim().toUpperCase();
              const scannedLearner = scanCode
                ? learners.find(l => (l.access_code || '').toUpperCase() === scanCode || l.full_name.toLowerCase().includes(scanCode.toLowerCase()))
                : null;
              const scannedHasVoted = scannedLearner ? votedSet.has(scannedLearner.id) : false;
              const scannedEligibility = scannedLearner ? checkVoterEligibility(scannedLearner, elec) : null;

              return (
                <div
                  className="p-4 rounded-xl border space-y-4 shadow-sm"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
                >
                  {/* Console Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            Delegate Turnout & Floor Ballot
                          </h5>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isLive
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 animate-pulse'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {isLive ? 'Floor Live' : 'Archived Log'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {isLive
                            ? 'Manage walk-in delegates without devices & verify floor turnout in real time'
                            : 'Historical record of delegates who participated and cast ballots'}
                        </p>
                      </div>
                    </div>

                    {/* View Switcher Tabs: Non-Voted vs Voted vs Quick Scanner */}
                    <div
                      className="flex items-center gap-1 p-1 rounded-xl border self-start sm:self-center"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setVoterConsoleTab(prev => ({ ...prev, [elec.id]: 'NON_VOTED' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeConsoleTab === 'NON_VOTED'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Non-Voted</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          activeConsoleTab === 'NON_VOTED' ? 'bg-black/30 text-white' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        }`}>
                          {nonVotedLearners.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoterConsoleTab(prev => ({ ...prev, [elec.id]: 'VOTED' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeConsoleTab === 'VOTED'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Voted</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          activeConsoleTab === 'VOTED' ? 'bg-black/30 text-white' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {votedLearners.length}
                        </span>
                      </button>

                      {isLive && (
                        <button
                          type="button"
                          onClick={() => setVoterConsoleTab(prev => ({ ...prev, [elec.id]: 'QUICK_BALLOT' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeConsoleTab === 'QUICK_BALLOT'
                              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Quick Scan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Turnout Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Floor Turnout: <strong className="text-amber-600 dark:text-amber-400 font-bold">{liveTurnoutPct}%</strong> ({liveVotedCount} of {totalEligible} Eligible Delegates Voted)
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {liveRemainingCount} Pending
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--border)' }}>
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${liveTurnoutPct}%` }}
                      />
                      <div
                        className="h-full bg-rose-500/20 transition-all duration-500"
                        style={{ width: `${100 - liveTurnoutPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Search and Filters Toolbar */}
                  {activeConsoleTab !== 'QUICK_BALLOT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {/* Search Bar */}
                      <div className="relative sm:col-span-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search name, code, party..."
                          value={voterSearch[elec.id] || ''}
                          onChange={(e) => setVoterSearch(prev => ({ ...prev, [elec.id]: e.target.value }))}
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs font-medium focus:outline-none"
                          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                        {(voterSearch[elec.id] || '') && (
                          <button
                            type="button"
                            onClick={() => setVoterSearch(prev => ({ ...prev, [elec.id]: '' }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Bench Filter */}
                      <div>
                        <select
                          value={currentBenchF}
                          onChange={(e) => setVoterBenchFilter(prev => ({ ...prev, [elec.id]: e.target.value as any }))}
                          className="w-full py-1.5 px-2.5 rounded-lg border text-xs font-medium focus:outline-none"
                          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          <option value="ALL">All Benches</option>
                          <option value="RULING">Ruling Bench Only</option>
                          <option value="OPPOSITION">Opposition Bench Only</option>
                        </select>
                      </div>

                      {/* Device / Login Filter */}
                      <div>
                        <select
                          value={currentDevF}
                          onChange={(e) => setVoterDeviceFilter(prev => ({ ...prev, [elec.id]: e.target.value as any }))}
                          className="w-full py-1.5 px-2.5 rounded-lg border text-xs font-medium focus:outline-none"
                          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          <option value="ALL">All Device Statuses</option>
                          <option value="LOGGED_IN">📱 Device Active (Logged In)</option>
                          <option value="NO_DEVICE">⚠️ No Device (Needs Floor Proxy)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 1: NON-VOTED DELEGATES */}
                  {activeConsoleTab === 'NON_VOTED' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                        <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredNonVoted.length}</strong> non-voted eligible delegates</span>
                        {isLive && (
                          <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Click "Cast Ballot" to vote on behalf of walk-ins
                          </span>
                        )}
                      </div>

                      {filteredNonVoted.length === 0 ? (
                        <div
                          className="p-8 text-center rounded-xl border border-dashed space-y-2"
                          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
                        >
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {nonVotedLearners.length === 0
                              ? '100% Turnout Achieved! All eligible delegates have cast their ballots.'
                              : 'No eligible delegates match the current search or filters.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                          {filteredNonVoted.map(l => {
                            const lastLogin = studentLoginMap.get(l.id) || studentLoginMap.get((l.access_code || '').toUpperCase());
                            const eligibility = checkVoterEligibility(l, elec);
                            const isProxyActive = proxyVotingLearnerId[elec.id] === l.id;

                            return (
                              <div
                                key={l.id}
                                className={`p-3 rounded-xl border transition-all ${
                                  isProxyActive
                                    ? 'border-amber-500/80 bg-amber-500/10 shadow-md ring-1 ring-amber-500/40'
                                    : 'hover:shadow-xs'
                                }`}
                                style={{
                                  backgroundColor: isProxyActive ? undefined : 'var(--bg-elevated)',
                                  borderColor: isProxyActive ? undefined : 'var(--border)'
                                }}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  {/* Left: Delegate Details */}
                                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                                    <div className="relative">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                        l.bench === 'Ruling'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                                      }`}>
                                        {l.full_name?.slice(0, 2).toUpperCase() || 'DL'}
                                      </div>
                                      {/* Status Dot */}
                                      <span
                                        title={lastLogin ? `Logged in from ${lastLogin.device_info}` : 'No device login recorded'}
                                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-950 ${
                                          lastLogin ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                      />
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <h6 className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                          {l.full_name}
                                        </h6>
                                        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                                          CODE: {l.access_code}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                        <span className={`font-semibold ${l.bench === 'Ruling' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                          {l.bench || 'Delegate'} Bench
                                        </span>
                                        <span>•</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{l.party_name || 'Independent'}</span>
                                        {l.constituency_number !== undefined && (
                                          <>
                                            <span>•</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>Const #{l.constituency_number} {l.constituency_name || ''}</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Device indicator & eligibility note */}
                                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                        {lastLogin ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                                            <Smartphone className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                            <span>Logged In ({lastLogin.device_type})</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                                            <Laptop className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                            <span>No Device (Walk-in)</span>
                                          </span>
                                        )}

                                        {!eligibility.eligible && (
                                          <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/30">
                                            {eligibility.reason}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Proxy Voting Action */}
                                  {isLive && (
                                    <div className="shrink-0 self-end sm:self-center">
                                      {eligibility.eligible ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setProxyVotingLearnerId(prev => ({
                                              ...prev,
                                              [elec.id]: isProxyActive ? null : l.id
                                            }));
                                          }}
                                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                            isProxyActive
                                              ? 'bg-slate-700 text-white'
                                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                          }`}
                                        >
                                          <Vote className="w-3.5 h-3.5" />
                                          <span>{isProxyActive ? 'Cancel' : 'Cast Floor Ballot'}</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] italic font-medium" style={{ color: 'var(--text-muted)' }}>Ineligible</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Inline Candidate Voting Drawer for this Delegate */}
                                {isLive && isProxyActive && (
                                  <div className="mt-3 pt-3 border-t space-y-2 animate-fadeIn" style={{ borderColor: 'var(--border)' }}>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-amber-600 dark:text-amber-400">
                                        Select Candidate on behalf of <strong>{l.full_name}</strong>:
                                      </span>
                                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                        1-click to register official vote
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {elec.candidates?.map(cand => (
                                        <button
                                          key={cand.id}
                                          type="button"
                                          onClick={() => {
                                            onCastVote(elec.id, cand.id, l.id);
                                            setProxyVotingLearnerId(prev => ({ ...prev, [elec.id]: null }));
                                            onShowToast(
                                              'Floor Ballot Cast',
                                              `Recorded vote for ${cand.name} on behalf of ${l.full_name}`,
                                              'success'
                                            );
                                          }}
                                          className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/25 text-left flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-xs"
                                        >
                                          <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 truncate">
                                              {cand.name}
                                            </div>
                                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                              {cand.party} • {cand.bench}
                                            </div>
                                          </div>
                                          <Vote className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-VIEW 2: VOTED DELEGATES */}
                  {activeConsoleTab === 'VOTED' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                        <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredVoted.length}</strong> ballots recorded</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Certified floor ballots
                        </span>
                      </div>

                      {filteredVoted.length === 0 ? (
                        <div
                          className="p-8 text-center rounded-xl border border-dashed space-y-2"
                          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
                        >
                          <Users className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            No ballots recorded yet for this election.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                          {filteredVoted.map(l => {
                            const lastLogin = studentLoginMap.get(l.id) || studentLoginMap.get((l.access_code || '').toUpperCase());
                            const candId = (elec as any).votes_by_delegate?.[l.id];
                            const votedCand = candId ? elec.candidates?.find(c => c.id === candId) : null;

                            return (
                              <div
                                key={l.id}
                                className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Check className="w-4 h-4" />
                                  </div>

                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h6 className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                        {l.full_name}
                                      </h6>
                                      <span
                                        className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border"
                                        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                      >
                                        {l.access_code}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                      <span className={`font-semibold ${l.bench === 'Ruling' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                        {l.bench} Bench
                                      </span>
                                      <span>•</span>
                                      <span style={{ color: 'var(--text-secondary)' }}>{l.party_name || 'Independent'}</span>
                                      {l.constituency_number !== undefined && (
                                        <>
                                          <span>•</span>
                                          <span style={{ color: 'var(--text-secondary)' }}>Const #{l.constituency_number}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Ballot Information */}
                                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                  {votedCand && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                      Voted: {votedCand.name}
                                    </span>
                                  )}

                                  {lastLogin ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                                      <Smartphone className="w-3 h-3" /> Student Device
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1">
                                      <Laptop className="w-3 h-3" /> Floor System Proxy
                                    </span>
                                  )}

                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Ballot Recorded
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-VIEW 3: QUICK SCAN / WALK-IN FLOOR TERMINAL */}
                  {isLive && activeConsoleTab === 'QUICK_BALLOT' && (
                    <div
                      className="p-4 rounded-xl border space-y-4 animate-fadeIn"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider block text-amber-600 dark:text-amber-400">
                          Fast Floor Scanner (Enter 6-character Code or Name):
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="e.g. 89F2A1 or Priya..."
                            value={quickScanCode[elec.id] || ''}
                            onChange={(e) => setQuickScanCode(prev => ({ ...prev, [elec.id]: e.target.value.toUpperCase() }))}
                            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold tracking-wider uppercase border focus:outline-none"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>
                      </div>

                      {/* Matched Delegate Card */}
                      {scannedLearner ? (
                        <div
                          className="p-4 rounded-xl border space-y-3 shadow-xs"
                          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h6 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>{scannedLearner.full_name}</h6>
                                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/20 text-amber-500">
                                  {scannedLearner.access_code}
                                </span>
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {scannedLearner.bench} Bench • {scannedLearner.party_name || 'Independent'}
                                {scannedLearner.constituency_number !== undefined ? ` • Constituency #${scannedLearner.constituency_number}` : ''}
                              </p>
                            </div>

                            <div>
                              {scannedHasVoted ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" /> Already Voted
                                </span>
                              ) : scannedEligibility?.eligible ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  ✓ Eligible to Vote
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  {scannedEligibility?.reason || 'Ineligible'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Candidate Voting Buttons if Eligible and Not Voted */}
                          {!scannedHasVoted && scannedEligibility?.eligible && (
                            <div className="pt-2 border-t border-slate-800 space-y-2">
                              <span className="text-xs font-bold text-slate-300">
                                Select candidate to cast official ballot:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {elec.candidates?.map(cand => (
                                  <button
                                    key={cand.id}
                                    type="button"
                                    onClick={() => {
                                      onCastVote(elec.id, cand.id, scannedLearner.id);
                                      setQuickScanCode(prev => ({ ...prev, [elec.id]: '' }));
                                      onShowToast(
                                        'Ballot Successfully Cast',
                                        `Voted for ${cand.name} on behalf of ${scannedLearner.full_name}`,
                                        'success'
                                      );
                                    }}
                                    className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/25 text-left flex items-center justify-between gap-2 transition-all cursor-pointer"
                                  >
                                    <div>
                                      <div className="text-xs font-bold text-white">{cand.name}</div>
                                      <div className="text-[10px] text-slate-400">{cand.party}</div>
                                    </div>
                                    <Vote className="w-4 h-4 text-amber-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : scanCode ? (
                        <p className="text-xs text-rose-400 italic">
                          No delegate found matching code or name "{scanCode}".
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Elections & House Ballots
          </h2>
          <p className="text-xs text-slate-400">
            Official legislative ballots, Speaker elections, Party Leadership votes, and live House divisions.
          </p>
        </div>

        {/* Action button + Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              try {
                const res = storageService.exportElectionData(eventId);
                onShowToast(
                  'Election Backup Generated',
                  `Downloaded offline JSON archive and CSV summary (${res.jsonCount} elections, ${res.flashVotesCount} flash votes).`,
                  'success'
                );
              } catch (err: any) {
                onShowToast('Export Error', err?.message || 'Failed to export backup', 'error');
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
            title="Download complete offline backup (JSON + CSV) of all election ballots, candidate tallies, and voter logs"
          >
            <Download className="w-4 h-4" />
            <span>📥 Export & Backup Election Data</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQuickLaunchModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Quick Launch Ballot</span>
          </button>

          <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}>
            <button
              onClick={() => setActiveTabSection('ELECTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTabSection === 'ELECTIONS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Leadership Ballots ({elections.length})
            </button>
            <button
              onClick={() => setActiveTabSection('BILLS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTabSection === 'BILLS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              Bill Voting ({bills.length})
            </button>
            <button
              onClick={() => setActiveTabSection('FLASH_VOTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTabSection === 'FLASH_VOTES'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Floor Divisions ({syncedFlashVotes.length})
            </button>
            <button
              onClick={() => setActiveTabSection('HISTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTabSection === 'HISTORY'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Election Results & History ({closedElections.length})
            </button>
            <button
              onClick={() => setActiveTabSection('TRASH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTabSection === 'TRASH'
                  ? 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Archived / Trash ({archivedElections.length})
            </button>
          </div>
        </div>
      </div>

      {/* ELECTIONS TAB CONTENT */}
      {activeTabSection === 'ELECTIONS' && (
        <div className="space-y-6">
          {/* DIVISION 1: HOUSE LEADERSHIP & CONSTITUTIONAL ELECTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  House Leadership & Key Constitutional Elections
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {constitutionalElections.length} Ballots
              </span>
            </div>

            <div className="space-y-2">
              {constitutionalElections.map((elec, idx) => renderElectionRow(elec, idx))}
            </div>
          </div>

          {/* DIVISION 2: POLITICAL PARTY LEADER ELECTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Political Party Leader Elections
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {partyLeaderElections.length} Ballots
              </span>
            </div>

            {partyLeaderElections.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed text-center space-y-2.5" style={{ borderColor: 'var(--border-soft)' }}>
                <p className="text-xs text-slate-400">
                  Party leader ballots will automatically be generated once political parties are assigned in the event configuration.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {partyLeaderElections.map((elec, idx) => renderElectionRow(elec, idx))}
              </div>
            )}
          </div>

          {/* CUSTOM ELECTIONS (if any) */}
          {customElections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Special & Custom Ballots
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{customElections.length} Ballots</span>
              </div>
              <div className="space-y-2">
                {customElections.map((elec, idx) => renderElectionRow(elec, idx))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BILL VOTING TAB CONTENT */}
      {activeTabSection === 'BILLS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Official Assembly Bill Voting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create and govern legislative bills, open parliamentary voting, and reveal official division results.
              </p>
            </div>
            <button
              onClick={() => {
                setBillNumber(`BILL NO. ${String(bills.length + 1).padStart(2, '0')}`);
                setBillTitle('');
                setBillSummary('');
                setBillProposer('');
                setBillAgendaId('');
                setIsNewBillModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Bill
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              <ScrollText className="w-10 h-10 mx-auto mb-3 text-slate-500 opacity-60" />
              <p className="text-sm font-semibold">No bills created for this assembly session.</p>
              <p className="text-xs text-slate-500 mt-1">Click "+ Create Bill" above to draft a legislative bill for floor voting.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => {
                const isVotingOpen = bill.status === 'Vote Open' || bill.status === 'Voting';
                const isVotingClosed = bill.status === 'Vote Closed' || bill.status === 'Result Hidden' || bill.status === 'Result Revealed';
                const isRevealed = bill.is_result_revealed || bill.status === 'Result Revealed';
                const totalVotes = bill.total_votes || (bill.ayes + bill.noes + (bill.abstain || 0));

                return (
                  <div
                    key={bill.id}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-amber-500 border border-amber-500/20">
                            {bill.bill_number}
                          </span>
                          <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                            {bill.title}
                          </h4>
                          {isVotingOpen && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
                              VOTING OPEN
                            </span>
                          )}
                          {isVotingClosed && !isRevealed && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              VOTING CLOSED • RESULT HIDDEN
                            </span>
                          )}
                          {isRevealed && (
                            <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              bill.result === 'PASSED'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white'
                            }`}>
                              RESULT REVEALED • {bill.result || 'PASSED'}
                            </span>
                          )}
                          {!isVotingOpen && !isVotingClosed && (
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {bill.status}
                            </span>
                          )}
                        </div>
                        {bill.summary && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            {bill.summary}
                          </p>
                        )}
                        {bill.proposer && (
                          <p className="text-[11px] text-slate-400 font-medium">
                            Introduced by: <span className="text-slate-700 dark:text-slate-300 font-semibold">{bill.proposer}</span>
                          </p>
                        )}
                      </div>

                      {/* Vote Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Open Vote Button */}
                        {!isVotingOpen && !isVotingClosed && (
                          <button
                            onClick={() => {
                              storageService.openBillVote(bill.id, eventId);
                              setBills(storageService.getBills(eventId));
                              onShowToast('Bill Voting Opened', `${bill.bill_number} is now live for voting`, 'success');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Open Vote
                          </button>
                        )}

                        {/* 2. Close Vote Button */}
                        {isVotingOpen && (
                          <button
                            onClick={() => {
                              storageService.closeBillVote(bill.id, eventId);
                              setBills(storageService.getBills(eventId));
                              onShowToast('Bill Voting Closed', `${bill.bill_number} voting has closed. Result is hidden.`, 'info');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" /> Close Vote
                          </button>
                        )}

                        {/* 3. Reveal Result Button */}
                        {isVotingClosed && !isRevealed && (
                          <button
                            onClick={() => {
                              storageService.revealBillResult(bill.id, eventId);
                              setBills(storageService.getBills(eventId));
                              onShowToast('Result Revealed', `${bill.bill_number} result transmitted to projector screen`, 'success');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Reveal Result
                          </button>
                        )}

                        {/* 4. Hide Result Button */}
                        {isVotingClosed && isRevealed && (
                          <button
                            onClick={() => {
                              storageService.hideBillResult(bill.id, eventId);
                              setBills(storageService.getBills(eventId));
                              onShowToast('Result Hidden', `${bill.bill_number} vote totals hidden from projector`, 'info');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-slate-700 hover:bg-slate-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" /> Hide Result
                          </button>
                        )}

                        {/* Delete/Archive Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${bill.bill_number} (${bill.title})?`)) {
                              storageService.deleteBill(bill.id, eventId);
                              setBills(storageService.getBills(eventId));
                              onShowToast('Bill Removed', `${bill.bill_number} removed`, 'info');
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Vote Counts Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                          YES (AYES)
                        </span>
                        <span className="text-xl md:text-2xl font-mono font-black text-emerald-700 dark:text-emerald-300">
                          {bill.ayes}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                          NO (NOES)
                        </span>
                        <span className="text-xl md:text-2xl font-mono font-black text-rose-700 dark:text-rose-300">
                          {bill.noes}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          ABSTAIN
                        </span>
                        <span className="text-xl md:text-2xl font-mono font-black text-slate-700 dark:text-slate-300">
                          {bill.abstain || 0}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                          TOTAL VOTES
                        </span>
                        <span className="text-xl md:text-2xl font-mono font-black text-amber-700 dark:text-amber-300">
                          {totalVotes}
                        </span>
                      </div>
                    </div>

                    {/* Result Banner (when revealed) */}
                    {isRevealed && (
                      <div className={`p-4 rounded-xl border text-center font-black text-lg md:text-xl flex items-center justify-center gap-3 ${
                        bill.result === 'PASSED'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                          : 'bg-rose-500/10 border-rose-500 text-rose-500'
                      }`}>
                        {bill.result === 'PASSED' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <span>BILL {bill.result}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FLASH VOTES TAB CONTENT */}
      {activeTabSection === 'FLASH_VOTES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Live Assembly Floor Divisions & Motions
            </h3>
            <button
              onClick={() => setIsNewPollOpen(true)}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Floor Division
            </button>
          </div>

          {syncedFlashVotes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              No active flash votes or floor divisions. Launch one using the button above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syncedFlashVotes.map((fv) => (
                <div key={fv.id} className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        {fv.motion_type || 'Division Motion'}
                      </span>
                      <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{fv.question}</h4>
                    </div>
                    {fv.status === 'ACTIVE' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Concluded
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-lg font-black text-emerald-400">{fv.ayes_count || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-emerald-500/80">AYES</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-lg font-black text-rose-400">{fv.noes_count || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-rose-500/80">NOES</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20">
                      <div className="text-lg font-black text-slate-400">{fv.abstain_count || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">ABSTAIN</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                    {fv.status === 'ACTIVE' && (
                      <button
                        onClick={() => onCloseFlashVote(fv.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
                      >
                        Close Floor Division
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the "${fv.question}" vote?`)) {
                          onDeleteFlashVote?.(fv.id);
                          onShowToast('Floor Division Deleted', `Deleted "${fv.question}" vote successfully.`, 'info');
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${fv.status !== 'ACTIVE' ? 'w-full' : ''}`}
                      title="Delete Floor Division"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Vote</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ELECTION HISTORY & RESULTS TAB CONTENT */}
      {activeTabSection === 'HISTORY' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Election Results & Historical Ballots
              </h3>
              <p className="text-xs text-slate-400">
                Archive of completed legislative elections, declared winners, vote counts, and turnout metrics.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shrink-0">
              {closedElections.length} Completed {closedElections.length === 1 ? 'Election' : 'Elections'}
            </span>
          </div>

          {closedElections.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed space-y-2" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <History className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No Election History Available Yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Completed and closed elections will automatically appear here with complete vote breakdowns, declared winners, and turnout statistics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedElections.map((elec) => {
                const sortedCandidates = [...(elec.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
                const leader = sortedCandidates[0] || null;
                const winnerName = elec.winner || (leader ? leader.name : 'Declared Winner');
                const totalEligible = learners.filter(l => isDelegateEligibleForElection(l, elec)).length;
                const totalVotes = elec.total_votes || 0;
                const turnoutPct = totalEligible > 0 ? Math.round((totalVotes / totalEligible) * 100) : 0;
                const completedAtText = elec.completed_at ? new Date(elec.completed_at).toLocaleString() : 'Concluded';

                return (
                  <div
                    key={elec.id}
                    className="p-5 rounded-2xl border space-y-4 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">
                            {elec.position || 'Ballot Position'}
                          </span>
                          <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {elec.title}
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Closed
                        </span>
                      </div>

                      {/* Winner Card */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 block">
                            Elected Winner
                          </span>
                          <h5 className="text-sm font-bold text-white truncate">
                            {winnerName}
                          </h5>
                          {leader && (
                            <p className="text-[11px] text-slate-300 truncate">
                              {leader.party} • {leader.votes} votes ({totalVotes > 0 ? Math.round((leader.votes / totalVotes) * 100) : 0}%)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Total Votes</div>
                          <div className="font-bold text-white font-mono mt-0.5">{totalVotes}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Eligible</div>
                          <div className="font-bold text-white font-mono mt-0.5">{totalEligible}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Turnout</div>
                          <div className="font-bold text-emerald-400 font-mono mt-0.5">{turnoutPct}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-soft)' }}>
                      <span className="text-[11px] text-slate-400 truncate">
                        {completedAtText}
                      </span>
                      <button
                        onClick={() => setSelectedHistoryElection(elec)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> View Results
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TRASH / ARCHIVED ELECTIONS VIEW */}
      {activeTabSection === 'TRASH' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
            <div>
              <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Archived Ballots & Trash Bin
              </h3>
              <p className="text-xs text-slate-400">
                Soft-deleted election ballots are safely archived here with all vote logs intact. You can restore any ballot to active voting at any time.
              </p>
            </div>
            <span className="text-xs font-mono text-rose-300 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800/60 shrink-0">
              {archivedElections.length} Archived {archivedElections.length === 1 ? 'Ballot' : 'Ballots'}
            </span>
          </div>

          {archivedElections.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed space-y-2" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <Archive className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Trash is Empty</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No ballots have been archived. When you delete a ballot, it is soft-deleted to this trash bin and can be restored whenever needed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedElections.map((elec) => {
                const totalVotes = elec.total_votes || (elec.candidates || []).reduce((s, c) => s + (c.votes || 0), 0);
                const archivedTime = elec.archived_at ? new Date(elec.archived_at).toLocaleString() : 'Archived';

                return (
                  <div
                    key={elec.id}
                    className="p-5 rounded-2xl border space-y-4 shadow-xs border-rose-500/20 bg-rose-500/5 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                            Archived • {elec.position || 'Ballot'}
                          </span>
                          <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {elec.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Archived on: {archivedTime}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                          In Trash
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Recorded Votes:</span>
                          <span className="font-mono font-bold text-amber-400">{totalVotes}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Nominees:</span>
                          <span className="font-mono font-bold text-white">{elec.candidates?.length || 0} candidates</span>
                        </div>
                        {elec.winner && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Declared Winner:</span>
                            <span className="font-bold text-emerald-400">{elec.winner}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                      <button
                        onClick={() => handleRestoreElection(elec.id, elec.title)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore to Active</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ELECTION HISTORY DETAILED RESULTS MODAL */}
      {selectedHistoryElection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider block">
                  Official Ballot Result Breakdown
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedHistoryElection.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoryElection(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(() => {
                const sorted = [...(selectedHistoryElection.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
                const top = sorted[0];
                const totalV = selectedHistoryElection.total_votes || 0;
                const totalEligible = learners.filter(l => isDelegateEligibleForElection(l, selectedHistoryElection)).length;
                const turnout = totalEligible > 0 ? Math.round((totalV / totalEligible) * 100) : 0;

                return (
                  <>
                    <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center space-y-1">
                      <Trophy className="w-7 h-7 text-amber-500 mx-auto" />
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">
                        Declared Winner
                      </span>
                      <h4 className="text-xl font-extrabold text-white">
                        {selectedHistoryElection.winner || (top ? top.name : 'No winner')}
                      </h4>
                      {top && (
                        <p className="text-xs text-amber-200/90 font-medium">
                          {top.party} • {top.votes} Votes ({totalV > 0 ? Math.round((top.votes / totalV) * 100) : 0}%)
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Votes</div>
                        <div className="text-base font-black text-white font-mono">{totalV}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Eligible Voters</div>
                        <div className="text-base font-black text-white font-mono">{totalEligible}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Turnout %</div>
                        <div className="text-base font-black text-emerald-400 font-mono">{turnout}%</div>
                      </div>
                    </div>

                    {/* Candidate Vote Breakdown */}
                    <div className="space-y-3 pt-2">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5 border-slate-800">
                        Candidate Ballots & Share
                      </h5>
                      {sorted.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No candidates recorded.</p>
                      ) : (
                        sorted.map((c, i) => {
                          const cPct = totalV > 0 ? Math.round(((c.votes || 0) / totalV) * 100) : 0;
                          const isWinner = (selectedHistoryElection.winner === c.name) || (i === 0 && (c.votes || 0) > 0);

                          return (
                            <div
                              key={c.id}
                              className={`p-3.5 rounded-xl border space-y-2 ${
                                isWinner ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{c.name}</span>
                                  {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <span className="font-mono font-bold text-white">
                                  {c.votes || 0} votes ({cPct}%)
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full ${isWinner ? 'bg-amber-500' : c.bench === 'Ruling' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${cPct}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex justify-between">
                                <span>{c.party} ({c.bench || 'Delegate'})</span>
                                <span>Rank #{i + 1}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end border-slate-800">
              <button
                onClick={() => setSelectedHistoryElection(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE NOMINATION MODAL (From Student Nominations or Delegate Directory) */}
      {activeElectionForNominate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider">
                  Nominate Candidate for Ballot
                </span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeElectionForNominate.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveNominateElectionId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Party Candidate Restriction Notice */}
            {activePartyLeaderParty && (
              <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Party Candidate Restriction:</strong> Only registered members of <strong>{activePartyLeaderParty.name}</strong> can be nominated for this election.
                </span>
              </div>
            )}

            {/* Source Tab Switcher */}
            <div className="px-5 pt-4 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setNominationSourceTab('NOMINATIONS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  nominationSourceTab === 'NOMINATIONS'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                From Student Submissions ({relevantStudentNominations.length})
              </button>
              <button
                onClick={() => setNominationSourceTab('ALL_DELEGATES')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  nominationSourceTab === 'ALL_DELEGATES'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                From Delegate Directory ({filteredCandidatePool.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search delegate by name, party, or constituency number..."
                  value={candidateSearchQuery}
                  onChange={(e) => setCandidateSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Candidate List Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {nominationSourceTab === 'NOMINATIONS' ? (
                relevantStudentNominations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    No student submissions found for this position. Switch to "From Delegate Directory" to nominate any MLA.
                  </div>
                ) : (
                  relevantStudentNominations.map((nom) => {
                    const matchLearner = learners.find(l => l.full_name?.toLowerCase() === nom.candidate_name?.toLowerCase() || l.id === nom.candidate_learner_id);
                    const isAlreadyCandidate = activeElectionForNominate.candidates?.some(c => c.name.toLowerCase() === nom.candidate_name.toLowerCase());

                    return (
                      <div
                        key={nom.id}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{nom.candidate_name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {nom.position}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {nom.party_name || matchLearner?.party_name || 'Independent'} • {matchLearner?.bench || nom.bench || 'Opposition'} Bench
                            {nom.manifesto ? ` • "${nom.manifesto.substring(0, 60)}..."` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isAlreadyCandidate || (matchLearner ? submittingCandidateId === matchLearner.id : false)}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (matchLearner) {
                              handleAddCandidateToElection(matchLearner, e);
                            } else {
                              if (activePartyLeaderParty) {
                                const targetPartyName = activePartyLeaderParty.name?.trim().toLowerCase();
                                const nomParty = nom.party_name?.trim().toLowerCase();
                                if (targetPartyName && nomParty && targetPartyName !== nomParty) {
                                  onShowToast('Ineligible Candidate', `${nom.candidate_name} cannot be added — not a registered member of ${activePartyLeaderParty.name}.`, 'error');
                                  return;
                                }
                              }
                              const result = onAddCandidate && onAddCandidate(activeElectionForNominate.id, {
                                name: nom.candidate_name,
                                party: nom.party_name || 'Independent',
                                bench: nom.bench || 'Opposition',
                                votes: 0
                              });
                              if (result && typeof result === 'object' && 'success' in result && !result.success) {
                                onShowToast('Nomination Rejected', result.reason || `${nom.candidate_name} cannot be added to this ballot.`, 'error');
                                return;
                              }
                              onShowToast('Candidate Added', `${nom.candidate_name} nominated for ballot`, 'success');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAlreadyCandidate
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                          }`}
                        >
                          {isAlreadyCandidate ? 'Nominated ✓' : '+ Add to Ballot'}
                        </button>
                      </div>
                    );
                  })
                )
              ) : (
                filteredCandidatePool.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    No delegates match your search or eligibility criteria.
                  </div>
                ) : (
                  filteredCandidatePool.map((l) => {
                    const isAlreadyCandidate = activeElectionForNominate.candidates?.some(c => c.name.toLowerCase() === l.full_name.toLowerCase());

                    return (
                      <div
                        key={l.id}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{l.full_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              l.bench === 'Ruling'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}>
                              {l.bench || 'Opposition'} Bench
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {getResolvedPartyName(l, parties) || l.party_name || 'Independent'} {l.constituency_number !== undefined ? `• Const #${l.constituency_number} ${l.constituency_name || ''}` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isAlreadyCandidate || submittingCandidateId === l.id}
                          onClick={(e) => handleAddCandidateToElection(l, e)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAlreadyCandidate
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              : submittingCandidateId === l.id
                              ? 'bg-amber-600/50 text-slate-300 cursor-wait'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                          }`}
                        >
                          {isAlreadyCandidate ? 'Nominated ✓' : submittingCandidateId === l.id ? 'Adding...' : '+ Add to Ballot'}
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                onClick={() => setActiveNominateElectionId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW FLASH VOTE MODAL */}
      {isNewPollOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl animate-scaleIn" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Launch House Floor Division</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pollQuestion.trim()) return;
                onCreateFlashVote(eventId, pollQuestion, 'ALL', pollMotionType);
                setPollQuestion('');
                setIsNewPollOpen(false);
                onShowToast('Floor Division Launched', 'Delegates can now vote AYE / NO / ABSTAIN', 'success');
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Motion Question / Title</label>
                <textarea
                  rows={3}
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g., That this House has no confidence in the Council of Ministers..."
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Motion Type</label>
                <select
                  value={pollMotionType}
                  onChange={(e) => setPollMotionType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="Division">Division</option>
                  <option value="Closure Motion">Closure Motion</option>
                  <option value="Point of Order">Point of Order</option>
                  <option value="No Confidence">No Confidence</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsNewPollOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 shadow cursor-pointer"
                >
                  Launch Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK LAUNCH BALLOT MODAL */}
      {isQuickLaunchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Quick Launch Instant Ballot
                  </h3>
                  <p className="text-xs text-slate-400">
                    Deploy spontaneous elections, caucus votes, or committee chair ballots on the fly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetQuickLaunchModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Ballot Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Ballot Title *
                </label>
                <input
                  type="text"
                  value={quickBallotTitle}
                  onChange={(e) => setQuickBallotTitle(e.target.value)}
                  placeholder="e.g., Party 1 Internal Whip, Committee 2 Chair Election, Sudden Floor Division"
                  className="w-full p-3 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-500"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  required
                />
                {/* Quick Title Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Suggestions:</span>
                  {[
                    'Party 1 Internal Whip',
                    'Party 2 Internal Whip',
                    'Committee 1 Chair Election',
                    'Committee 2 Chair Election',
                    'Sudden Floor Division'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setQuickBallotTitle(sug)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Ballot Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Leadership', 'Floor Division', 'Committee Ballot', 'Flash Vote'] as const).map((cat) => {
                    const isSelected = quickCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setQuickCategory(cat)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Who Can Vote? (Voter Eligibility Filter) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Who Can Vote? (Voter Eligibility Filter) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* All House */}
                  <label
                    onClick={() => setQuickEligibilityScope('all')}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-1 cursor-pointer transition-all ${
                      quickEligibilityScope === 'all'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eligibilityScope"
                        checked={quickEligibilityScope === 'all'}
                        onChange={() => setQuickEligibilityScope('all')}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs">All House Delegates</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pl-5">
                      Everyone can participate and vote.
                    </span>
                  </label>

                  {/* Specific Party */}
                  <label
                    onClick={() => {
                      setQuickEligibilityScope('party');
                      if (!quickEligibilityTargetId && parties.length > 0) {
                        setQuickEligibilityTargetId(parties[0].id);
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-1 cursor-pointer transition-all ${
                      quickEligibilityScope === 'party'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eligibilityScope"
                        checked={quickEligibilityScope === 'party'}
                        onChange={() => {
                          setQuickEligibilityScope('party');
                          if (!quickEligibilityTargetId && parties.length > 0) {
                            setQuickEligibilityTargetId(parties[0].id);
                          }
                        }}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs">Specific Party Only</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pl-5">
                      Restricted to a selected party.
                    </span>
                  </label>

                  {/* Specific Committee */}
                  <label
                    onClick={() => {
                      setQuickEligibilityScope('committee');
                      if (!quickEligibilityTargetId && eventCommittees.length > 0) {
                        setQuickEligibilityTargetId(eventCommittees[0].id);
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-1 cursor-pointer transition-all ${
                      quickEligibilityScope === 'committee'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eligibilityScope"
                        checked={quickEligibilityScope === 'committee'}
                        onChange={() => {
                          setQuickEligibilityScope('committee');
                          if (!quickEligibilityTargetId && eventCommittees.length > 0) {
                            setQuickEligibilityTargetId(eventCommittees[0].id);
                          }
                        }}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs">Specific Committee Only</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pl-5">
                      Restricted to committee delegates.
                    </span>
                  </label>
                </div>

                {/* Sub-selector for Party */}
                {quickEligibilityScope === 'party' && (
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5 animate-fadeIn">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Select Eligible Political Party:
                    </label>
                    <select
                      value={quickEligibilityTargetId}
                      onChange={(e) => setQuickEligibilityTargetId(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                    >
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.bench} Bench)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sub-selector for Committee */}
                {quickEligibilityScope === 'committee' && (
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5 animate-fadeIn">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Select Eligible Committee:
                    </label>
                    {eventCommittees.length === 0 ? (
                      <p className="text-xs text-amber-400">
                        No committees found for this event. You can configure committees in the Committees tab.
                      </p>
                    ) : (
                      <select
                        value={quickEligibilityTargetId}
                        onChange={(e) => setQuickEligibilityTargetId(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                      >
                        {eventCommittees.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.topic ? `(${c.topic})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Choose Nominees / Candidates (Multi-Select from Delegates) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Choose Nominees / Candidates *
                  </label>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    selectedCandidateLearnerIds.length >= 2
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {selectedCandidateLearnerIds.length} Selected (Min 2 required)
                  </span>
                </div>

                {/* Selected Candidates Badges */}
                {selectedCandidateLearnerIds.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl bg-slate-800/50 border border-slate-700">
                    {selectedCandidateLearnerIds.map((lid) => {
                      const l = learners.find((item) => item.id === lid);
                      if (!l) return null;
                      return (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        >
                          <span>{l.full_name}</span>
                          <span className="text-[10px] text-amber-400/80 font-mono">({l.access_code})</span>
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateLearnerIds((prev) => prev.filter((id) => id !== lid))}
                            className="p-0.5 hover:bg-amber-500/30 rounded text-amber-200 cursor-pointer"
                            title="Remove candidate"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search Delegate List */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={quickCandidateSearch}
                    onChange={(e) => setQuickCandidateSearch(e.target.value)}
                    placeholder="Search delegates by name, student ID / access code, party, or constituency..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Scrollable Delegate Picker List */}
                <div
                  className="rounded-xl border divide-y max-h-56 overflow-y-auto"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                >
                  {(() => {
                    const q = quickCandidateSearch.toLowerCase().trim();
                    const filtered = learners.filter((l) => {
                      if (!q) return true;
                      const nameMatch = (l.full_name || '').toLowerCase().includes(q);
                      const codeMatch = (l.access_code || '').toLowerCase().includes(q);
                      const partyMatch = (l.party_name || '').toLowerCase().includes(q);
                      const constMatch = (l.constituency_name || '').toLowerCase().includes(q);
                      return nameMatch || codeMatch || partyMatch || constMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-slate-400 italic">
                          No delegates found matching "{quickCandidateSearch}".
                        </div>
                      );
                    }

                    return filtered.map((l) => {
                      const isSelected = selectedCandidateLearnerIds.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            setSelectedCandidateLearnerIds((prev) =>
                              isSelected ? prev.filter((id) => id !== l.id) : [...prev, l.id]
                            );
                          }}
                          className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div
                              className="accent-amber-500 rounded cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white truncate">{l.full_name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  {l.access_code}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>{getResolvedPartyName(l, parties) || l.party_name || 'Independent'}</span>
                                {l.constituency_name && <span>• {l.constituency_name}</span>}
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                            l.bench === 'Ruling'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {l.bench || 'Delegate'}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="text-xs text-slate-400">
                {selectedCandidateLearnerIds.length < 2 ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Select at least 2 delegates to enable launch.
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Ready to deploy ballot.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetQuickLaunchModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCandidateLearnerIds.length < 2 || !quickBallotTitle.trim()}
                  onClick={() => handleLaunchQuickBallot(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={selectedCandidateLearnerIds.length < 2 || !quickBallotTitle.trim()}
                  onClick={() => handleLaunchQuickBallot(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Live Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCIDENTAL DELETION GUARD MODAL */}
      {deletingElection && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-scaleIn border-rose-500/40 bg-slate-900 text-white p-6 space-y-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Accidental Deletion Guard
                </h3>
                <p className="text-xs text-rose-300/90 font-medium">
                  This ballot has recorded votes ({deletingElection.total_votes || (deletingElection.candidates || []).reduce((s, c) => s + (c.votes || 0), 0)} votes cast).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-slate-300 space-y-2">
              <p>
                To safeguard election integrity and prevent accidental data loss, ballots with active votes cannot be instantly removed.
              </p>
              <p className="text-amber-300 font-medium">
                Confirming will safely soft-delete this ballot to the <strong>Archived / Trash</strong> bin (where you can restore it anytime).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Type <span className="font-mono font-bold text-rose-400">DELETE</span> below to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingElection(null);
                  setDeleteConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmInput.trim() !== 'DELETE'}
                onClick={handleConfirmGuardDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Archive to Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {isNewBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-white p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Legislative Bill</h3>
                  <p className="text-xs text-slate-400">Floor Division / Legislative Proceeding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBillModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bill Number / Ref <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILL NO. 04"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bill Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tamil Nadu Youth Skill Development Bill, 2026"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description / Preamble Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="A bill concerning development, apprenticeship, and technological enablement..."
                  value={billSummary}
                  onChange={(e) => setBillSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Proposer / Sponsor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hon. Minister for Education"
                    value={billProposer}
                    onChange={(e) => setBillProposer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Session / Agenda Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Legislative Business"
                    value={billAgendaId}
                    onChange={(e) => setBillAgendaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewBillModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!billTitle.trim()}
                onClick={() => {
                  const newBill = storageService.createBill({
                    bill_number: billNumber.trim() || `BILL NO. ${bills.length + 1}`,
                    title: billTitle.trim(),
                    description: billSummary.trim(),
                    proposer: billProposer.trim() || undefined,
                    agenda_id: billAgendaId.trim() || undefined,
                    event_id: eventId,
                    status: 'Draft',
                    ayes: 0,
                    noes: 0,
                    abstain: 0,
                    total_votes: 0,
                    is_result_revealed: false,
                    votes: [],
                    voted_delegate_ids: []
                  }, eventId);
                  setBills(storageService.getBills(eventId));
                  setIsNewBillModalOpen(false);
                  setBillNumber('');
                  setBillTitle('');
                  setBillSummary('');
                  setBillProposer('');
                  setBillAgendaId('');
                  onShowToast('Bill Created', `${newBill.bill_number} drafted successfully.`, 'success');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Draft Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

