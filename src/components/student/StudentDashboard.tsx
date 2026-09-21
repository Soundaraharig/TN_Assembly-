import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  Learner,
  CollegeEvent,
  AgendaItem,
  AgendaDay,
  Party,
  Committee,
  Nomination,
  NominationPosition,
  Election,
  LiveFlashVote,
  EventDeadline,
  ProceedingsQuestion,
  BillProceeding
} from '../../types';
import {
  storageService,
  isQuestionForMinister,
  getMinisterAssignedMinistry
} from '../../services/storageService';
import { getEventSlug } from '../../utils/slug';
import {
  Landmark,
  MapPin,
  BookOpen,
  Clock,
  Hand,
  CheckCircle2,
  Sparkles,
  Radio,
  FileSpreadsheet,
  Send,
  Lock,
  Unlock,
  HelpCircle,
  UserCheck,
  Vote,
  Zap,
  Check,
  Crown,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  X
} from 'lucide-react';
import { StudentAllocationCard } from './StudentAllocationCard';

type StudentDashboardTab = 'desk' | 'voting' | 'agenda';

interface StudentDashboardProps {
  student: Learner;
  event: CollegeEvent | null;
  agenda: AgendaItem[];
  party: Party | null;
  committee: Committee | null;
  nominations?: Nomination[];
  openNominationPositions?: string[];
  elections?: Election[];
  flashVotes?: LiveFlashVote[];
  onFileNomination?: (nom: Partial<Nomination>) => void;
  onCastVote?: (electionId: string, candidateId: string, delegateId?: string) => void;
  onCastFlashVote?: (voteId: string, learner: Learner, decision: 'AYE' | 'NO' | 'ABSTAIN') => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  event,
  agenda = [],
  party,
  committee,
  nominations = [],
  openNominationPositions = [],
  elections = [],
  flashVotes = [],
  onFileNomination,
  onCastVote,
  onCastFlashVote,
  onShowToast
}) => {
  const [floorRequested, setFloorRequested] = useState(false);

  // Nomination form state
  const [selectedNomPosition, setSelectedNomPosition] = useState<string>(
    openNominationPositions.length > 0 ? openNominationPositions[0] : 'Speaker'
  );
  const [nomManifesto, setNomManifesto] = useState('');
  const [nomSubmitted, setNomSubmitted] = useState(false);

  // Parliamentary Question Hour State
  const eventSlug = event ? getEventSlug(event) : 'jkkncet-tn-assembly-2026';
  const resolvedEventId = event?.id || storageService.getEvents().find(e => getEventSlug(e) === eventSlug)?.id || eventSlug;
  const targetEventId = resolvedEventId;
  const [deadline, setDeadline] = useState<EventDeadline>(() => {
    return storageService.getEventDeadline(eventSlug) || storageService.getEventDeadline(resolvedEventId);
  });
  const ministerInfo = useMemo(() => getMinisterAssignedMinistry(student.role), [student.role]);
  const isMinister = Boolean(ministerInfo);
  const [studentQuestions, setStudentQuestions] = useState<ProceedingsQuestion[]>([]);
  const [approvedHouseQuestions, setApprovedHouseQuestions] = useState<ProceedingsQuestion[]>([]);
  const [ministerQuestions, setMinisterQuestions] = useState<ProceedingsQuestion[]>([]);
  const [eventMinistries, setEventMinistries] = useState<string[]>(() => {
    const fromId = storageService.getCabinetMinistries(resolvedEventId);
    if (fromId.length > 0) return fromId;
    return storageService.getCabinetMinistries(eventSlug);
  });
  const [isMinistriesLoading, setIsMinistriesLoading] = useState<boolean>(() => {
    const fromId = storageService.getCabinetMinistries(resolvedEventId);
    const fromSlug = storageService.getCabinetMinistries(eventSlug);
    return fromId.length === 0 && fromSlug.length === 0;
  });
  const [questionMinistry, setQuestionMinistry] = useState<string>(() => {
    const mins = storageService.getCabinetMinistries(resolvedEventId);
    const resolved = mins.length > 0 ? mins : storageService.getCabinetMinistries(eventSlug);
    return resolved.length > 0 ? resolved[0] : '';
  });
  const [questionType, setQuestionType] = useState<ProceedingsQuestion['question_type']>('Standard');
  const [questionText, setQuestionText] = useState<string>('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState<boolean>(false);
  const [questionViewMode, setQuestionViewMode] = useState<'portfolio' | 'my_questions' | 'approved_house'>(() => {
    const min = getMinisterAssignedMinistry(student.role);
    return min ? 'portfolio' : 'my_questions';
  });
  const [viewingQuestion, setViewingQuestion] = useState<ProceedingsQuestion | null>(null);

  // Synced Floor & Election Data
  const [syncedElections, setSyncedElections] = useState<Election[]>(elections);
  const [syncedFlashVotes, setSyncedFlashVotes] = useState<LiveFlashVote[]>(flashVotes);
  const [syncedNominations, setSyncedNominations] = useState<Nomination[]>(nominations);
  const [syncedBills, setSyncedBills] = useState<BillProceeding[]>(() => storageService.getBills(resolvedEventId));

  useEffect(() => {
    setSyncedElections(elections);
  }, [elections]);

  useEffect(() => {
    setSyncedFlashVotes(flashVotes);
  }, [flashVotes]);

  useEffect(() => {
    setSyncedNominations(nominations);
  }, [nominations]);

  useEffect(() => {
    const currentResolvedId = event?.id || storageService.getEvents().find(e => getEventSlug(e) === eventSlug)?.id || targetEventId;
    // Ensure realtime broadcast channel is active on student client scoped to event
    storageService.setupRealtimeSync(currentResolvedId);
    console.log("Question Hour event ID:", currentResolvedId);

    const refreshLiveState = () => {
      const activeId = event?.id || storageService.getEvents().find(e => getEventSlug(e) === eventSlug)?.id || targetEventId;
      if (eventSlug || activeId) {
        const freshDeadline = storageService.getEventDeadline(eventSlug) || storageService.getEventDeadline(activeId);
        setDeadline(freshDeadline);
        const allQ = [...storageService.getProceedingsQuestions(eventSlug), ...storageService.getProceedingsQuestions(activeId)];
        const uniqueQ = Array.from(new Map(allQ.map(q => [q.id, q])).values());
        setStudentQuestions(uniqueQ.filter(q => q.student_id === student.id || q.student_name === student.full_name));
        const approvedAndStarred = uniqueQ.filter(q => q.status === 'Approved' || q.status === 'Starred');
        setApprovedHouseQuestions(approvedAndStarred);
        if (ministerInfo) {
          setMinisterQuestions(approvedAndStarred.filter(q => isQuestionForMinister(q, student.role)));
        } else {
          setMinisterQuestions([]);
        }

        // Refresh configured ministries from Cabinet & Shadow Ministry system
        const fromId = storageService.getCabinetMinistries(activeId);
        const activeMins = fromId.length > 0 ? fromId : storageService.getCabinetMinistries(eventSlug);
        setEventMinistries(activeMins);
        setIsMinistriesLoading(false);
        setQuestionMinistry(prev => {
          if (activeMins.includes(prev)) return prev;
          return activeMins.length > 0 ? activeMins[0] : '';
        });

        const updatedElecs = storageService.getElections(activeId, 'student', student.id);
        setSyncedElections(updatedElecs);
        const updatedFV = storageService.getFlashVotes(activeId, 'student', student.id);
        setSyncedFlashVotes(updatedFV);
        const updatedNoms = storageService.getNominations(activeId, 'student', student.id);
        setSyncedNominations(updatedNoms);
        const updatedBills = storageService.getBills(activeId);
        setSyncedBills(updatedBills);
      }
    };
    refreshLiveState();

    // Query the database directly for ministries configured for THIS specific event
    if (currentResolvedId) {
      storageService.fetchEventMinistries(currentResolvedId).then(mins => {
        setEventMinistries(mins);
        setIsMinistriesLoading(false);
        setQuestionMinistry(prev => {
          if (mins.includes(prev)) return prev;
          return mins.length > 0 ? mins[0] : '';
        });
      }).catch(err => {
        console.warn('[StudentDashboard] fetchEventMinistries error:', err);
        setIsMinistriesLoading(false);
      });
    }

    if (currentResolvedId || eventSlug) {
      storageService.fetchProceedingsQuestionsOnDemand(currentResolvedId || eventSlug).then(() => {
        refreshLiveState();
      }).catch(err => {
        console.warn('[StudentDashboard] on-demand fetch error:', err);
      });
    }

    const unsub = storageService.subscribe(() => {
      refreshLiveState();
    });

    const handleStorageEvent = () => refreshLiveState();
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [eventSlug, targetEventId, event?.id, student.id, student.full_name, student.role, ministerInfo]);

  // Derived live voting lists
  const liveElections = useMemo(() => syncedElections.filter(e => e.status === 'Live' || e.status === 'live'), [syncedElections]);
  const activeFlashVotes = useMemo(() => syncedFlashVotes.filter(f => f.status === 'ACTIVE' || (f.status as string) === 'active'), [syncedFlashVotes]);
  const liveBills = useMemo(() => syncedBills.filter(b => b.status === 'Vote Open' || b.status === 'Voting'), [syncedBills]);

  const hasLiveVoting = useMemo(() => {
    return liveElections.length > 0 || activeFlashVotes.length > 0 || liveBills.length > 0;
  }, [liveElections, activeFlashVotes, liveBills]);

  // Client-side Tab State (Always opens on 'desk' by default)
  const [activeTab, setActiveTab] = useState<StudentDashboardTab>('desk');

  // On-demand agenda loading: do NOT fetch on login. Fetch ONLY when clicking Agenda tab, cached in memory.
  const [studentAgenda, setStudentAgenda] = useState<AgendaItem[]>(agenda);
  const [isAgendaLoading, setIsAgendaLoading] = useState(false);
  const agendaFetchedRef = useRef(false);

  useEffect(() => {
    if (activeTab === 'agenda' && !agendaFetchedRef.current) {
      agendaFetchedRef.current = true;
      setIsAgendaLoading(true);
      storageService.fetchAgendaOnDemand(targetEventId).then(items => {
        setStudentAgenda(items);
        setIsAgendaLoading(false);
      }).catch(err => {
        console.warn('[StudentDashboard] Failed to fetch on-demand agenda:', err);
        setIsAgendaLoading(false);
      });
    }
  }, [activeTab, targetEventId]);

  // Agenda tab sub-state
  const currentAgendaItem = useMemo(() => {
    return studentAgenda.find(a => a.is_current || a.status === 'In Progress') || studentAgenda[0];
  }, [studentAgenda]);

  const [agendaDayFilter, setAgendaDayFilter] = useState<AgendaDay | 'All'>('Day 1');
  const [showCompletedSessions, setShowCompletedSessions] = useState(false);

  const isQuestionWindowOpen = useMemo(() => {
    if (deadline.is_open !== undefined) return deadline.is_open;
    if (deadline.status !== undefined) return deadline.status === 'OPEN';
    if (!deadline.questions_deadline_at) return true;
    return new Date().getTime() <= new Date(deadline.questions_deadline_at).getTime();
  }, [deadline.is_open, deadline.status, deadline.questions_deadline_at]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (isSubmittingQuestion) return;
    if (!isQuestionWindowOpen) {
      onShowToast('Submission Closed', 'Question submission deadline has passed.', 'error');
      return;
    }
    if (isMinistriesLoading) {
      onShowToast('Please Wait', 'Ministries are still loading for this event.', 'info');
      return;
    }
    if (!questionMinistry || eventMinistries.length === 0) {
      onShowToast('Ministry Required', 'No ministries configured for this event or no ministry selected.', 'error');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const studentBench: 'Ruling' | 'Opposition' = student.bench === 'Opposition' ? 'Opposition' : 'Ruling';

      const newQ: Partial<ProceedingsQuestion> = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        event_id: resolvedEventId,
        event_slug: eventSlug,
        student_id: student.id,
        student_name: student.full_name,
        bench: studentBench,
        constituency: student.constituency_name || (student.constituency_number ? `#${student.constituency_number}` : 'Assembly Delegate'),
        ministry: questionMinistry,
        target_ministry_id: questionMinistry.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        target_ministry_name: questionMinistry,
        question_type: questionType,
        question_text: questionText.trim(),
        status: 'Submitted'
      };

      const result = await storageService.submitProceedingsQuestion(newQ);
      if (result.success) {
        setQuestionText('');
        onShowToast('Question Submitted', 'Question submitted successfully and is awaiting approval.', 'success');
        const allQ = [...storageService.getProceedingsQuestions(eventSlug), ...storageService.getProceedingsQuestions(resolvedEventId)];
        const uniqueQ = Array.from(new Map(allQ.map(q => [q.id, q])).values());
        setStudentQuestions(uniqueQ.filter(q => q.student_id === student.id || q.student_name === student.full_name));
      } else {
        onShowToast('Submission Failed', result.error || 'Failed to submit question to the database.', 'error');
      }
    } catch (err: any) {
      onShowToast('Submission Error', err?.message || 'An error occurred while submitting.', 'error');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Check if current student is assigned as Speaker or Deputy Speaker
  const isAssignedSpeakerOrDeputySpeaker = useMemo(() => {
    const roleLower = (student.role || '').toLowerCase();
    if (roleLower.includes('speaker')) return true;

    // Also check if winner of an election for Speaker / Deputy Speaker
    const isElectedPresiding = syncedElections.some(e => {
      const isPresidingType =
        e.type === 'SPEAKER' ||
        e.type === 'DEPUTY_SPEAKER' ||
        (e.position && e.position.toLowerCase().includes('speaker'));
      if (!isPresidingType || !e.winner) return false;
      const winningCand = e.candidates?.find(
        c => c.id === e.winner || c.learner_id === e.winner || c.name?.toLowerCase() === student.full_name?.toLowerCase()
      );
      if (winningCand && (winningCand.learner_id === student.id || winningCand.name?.toLowerCase() === student.full_name?.toLowerCase())) {
        return true;
      }
      return e.winner === student.id || e.winner.toLowerCase() === student.full_name.toLowerCase();
    });

    return isElectedPresiding;
  }, [student.role, student.id, student.full_name, syncedElections]);

  // Student's own filed nominations
  const myNominations = useMemo(() => {
    return syncedNominations.filter(
      n => n.candidate_learner_id === student.id || (n.candidate_name && n.candidate_name.toLowerCase() === student.full_name.toLowerCase())
    );
  }, [syncedNominations, student.id, student.full_name]);

  const myNominatedPositions = useMemo(() => {
    return new Set(
      myNominations
        .filter(n => n.status !== 'Rejected')
        .map(n => n.position)
    );
  }, [myNominations]);

  // Open positions that this student has NOT yet nominated for (1 nomination per member per post)
  const availableNominationPositions = useMemo(() => {
    return openNominationPositions.filter(pos => !myNominatedPositions.has(pos as any));
  }, [openNominationPositions, myNominatedPositions]);

  // Default selected nomination position to the first available open position
  useEffect(() => {
    if (availableNominationPositions.length > 0) {
      if (!selectedNomPosition || !availableNominationPositions.includes(selectedNomPosition)) {
        setSelectedNomPosition(availableNominationPositions[0]);
      }
    }
  }, [availableNominationPositions, selectedNomPosition]);

  const isRuling = student.bench === 'Ruling';

  // Check electorate eligibility for a student
  const isStudentEligibleForElection = (elec: Election): { eligible: boolean; reason?: string } => {
    // 1. Explicit Eligibility Filter configured on ballot
    if (elec.eligibility) {
      if (elec.eligibility.scope === 'all') {
        return { eligible: true };
      }
      if (elec.eligibility.scope === 'party') {
        const matchesParty = student.party_id
          ? student.party_id === elec.eligibility.targetId
          : student.party_name && elec.eligibility.targetName && student.party_name.toLowerCase() === elec.eligibility.targetName.toLowerCase();
        if (matchesParty) {
          return { eligible: true };
        }
        const targetDesc = elec.eligibility.targetName || 'the assigned political party';
        return {
          eligible: false,
          reason: `Active Ballot in Progress: Restricted to ${targetDesc}. Your bench is not participating in this vote.`
        };
      }
      if (elec.eligibility.scope === 'committee') {
        const studentCommitteeId = (student as any).committee_id;
        const studentCommitteeName = (student as any).committee_name;
        const matchesCommittee = studentCommitteeId
          ? studentCommitteeId === elec.eligibility.targetId
          : studentCommitteeName && elec.eligibility.targetName && studentCommitteeName.toLowerCase() === elec.eligibility.targetName.toLowerCase();
        if (matchesCommittee) {
          return { eligible: true };
        }
        const targetDesc = elec.eligibility.targetName || 'the assigned committee';
        return {
          eligible: false,
          reason: `Active Ballot in Progress: Restricted to ${targetDesc}. Your bench is not participating in this vote.`
        };
      }
    }

    const title = (elec.title || '').toLowerCase();
    const pos = (elec.position || '').toLowerCase();

    // Party Leader election check
    if (title.includes('party leader') && !title.includes('ruling') && !title.includes('opposition')) {
      if (student.party_name && title.includes(student.party_name.toLowerCase())) {
        return { eligible: true };
      }
      const pMatch = elec.title.replace(/\s+leader election$/i, '').replace(/\s+party leader$/i, '').trim();
      return {
        eligible: false,
        reason: `Active Ballot in Progress: Restricted to ${pMatch || 'Party'}. Your bench is not participating in this vote.`
      };
    }

    if (pos.includes('opposition') || title.includes('opposition') || title.includes('lop')) {
      if (student.bench !== 'Opposition') {
        return {
          eligible: false,
          reason: 'Active Ballot in Progress: Restricted to Opposition Bench MLAs. Your bench is not participating in this vote.'
        };
      }
      return { eligible: true };
    }

    if (pos.includes('ruling') || title.includes('ruling') || title.includes('chief minister') || title.includes('prime minister')) {
      if (student.bench !== 'Ruling') {
        return {
          eligible: false,
          reason: 'Active Ballot in Progress: Restricted to Ruling Bench MLAs. Your bench is not participating in this vote.'
        };
      }
      return { eligible: true };
    }

    return { eligible: true };
  };

  const handleRequestFloor = () => {
    setFloorRequested(true);
    onShowToast(
      'Point of Order Submitted',
      `Floor request sent to Assembly Speaker for ${student.full_name} (${student.constituency_name || 'MLA'})`,
      'success'
    );
    setTimeout(() => setFloorRequested(false), 5000);
  };

  const handleStudentNominationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onFileNomination) return;

    if (isAssignedSpeakerOrDeputySpeaker) {
      onShowToast(
        'Nomination Ineligible',
        'Assigned Speaker or Deputy Speaker delegates cannot file candidacy nominations.',
        'error'
      );
      return;
    }

    if (myNominatedPositions.has(selectedNomPosition as NominationPosition)) {
      onShowToast(
        'Already Nominated',
        `You have already filed a nomination for ${selectedNomPosition}. Each member is eligible to nominate only once per post.`,
        'error'
      );
      return;
    }

    onFileNomination({
      event_id: student.event_id || '',
      position: selectedNomPosition as NominationPosition,
      candidate_learner_id: student.id,
      candidate_name: student.full_name,
      party_name: student.party_name || 'Independent',
      bench: student.bench || 'Ruling',
      manifesto: nomManifesto.trim() || 'Committed to upholding parliamentary rules, student welfare, and progressive policy debate.',
      status: 'Approved'
    });

    setNomSubmitted(true);
    setNomManifesto('');
    onShowToast(
      'Nomination Submitted',
      `Your nomination for ${selectedNomPosition} has been filed successfully!`,
      'success'
    );
    setTimeout(() => setNomSubmitted(false), 4000);
  };

  // Agenda tab day filtering & splitting
  const filteredAgendaItems = useMemo(() => {
    return studentAgenda
      .filter(item => agendaDayFilter === 'All' || item.day === agendaDayFilter)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [studentAgenda, agendaDayFilter]);

  const activeOrUpcomingAgendaItems = useMemo(() => {
    return filteredAgendaItems.filter(item => item.status !== 'Completed');
  }, [filteredAgendaItems]);

  const completedAgendaItems = useMemo(() => {
    return filteredAgendaItems.filter(item => item.status === 'Completed');
  }, [filteredAgendaItems]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      
      {/* ── MOBILE-FIRST SEGMENTED / STICKY TAB NAVIGATION BAR ── */}
      <div className="sticky top-2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          
          {/* Tab 1: My Delegate Desk 📋 */}
          <button
            type="button"
            id="tab-btn-desk"
            onClick={() => setActiveTab('desk')}
            className={`py-2.5 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              activeTab === 'desk'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">My Desk</span>
          </button>

          {/* Tab 2: Live Ballots / Voting 🗳️ */}
          <button
            type="button"
            id="tab-btn-voting"
            onClick={() => setActiveTab('voting')}
            className={`relative py-2.5 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              activeTab === 'voting'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-900/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Vote className="w-4 h-4 shrink-0" />
            <span className="truncate">Voting</span>
            {hasLiveVoting && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse shadow-sm">
                LIVE NOW
              </span>
            )}
          </button>

          {/* Tab 3: Assembly Agenda 📅 */}
          <button
            type="button"
            id="tab-btn-agenda"
            onClick={() => setActiveTab('agenda')}
            className={`py-2.5 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              activeTab === 'agenda'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate">Agenda</span>
            {currentAgendaItem?.is_current && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: "LIVE BALLOTS" / "VOTING" 🗳️                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'voting' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Vote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  Official Floor Ballots & Divisions
                  {hasLiveVoting && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                      LIVE NOW
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cast your vote for House Leadership, Speaker, and Floor Motions
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
              {liveElections.length + activeFlashVotes.length + liveBills.length} Active
            </span>
          </div>

          {/* 1. Live Floor Divisions / Flash Votes */}
          {activeFlashVotes.length > 0 && onCastFlashVote && (
            <div className="bg-white dark:bg-slate-900 border-2 border-teal-500/50 rounded-3xl p-5 md:p-6 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Live Floor Division & Motion
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-500 text-white animate-pulse">
                        ACTIVE DIVISION
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Immediate division vote: AYE / NO / ABSTAIN</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {activeFlashVotes.map(fv => {
                  const myVote = fv.votes?.find(v => v.learner_id === student.id)?.vote;

                  return (
                    <div key={fv.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                            {fv.motion_type || 'Floor Motion'}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">{fv.question}</h4>
                        </div>
                        {myVote && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                            Voted: {myVote}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                          type="button"
                          disabled={!!myVote}
                          onClick={() => {
                            onCastFlashVote(fv.id, student, 'AYE');
                            onShowToast('Division Vote Cast', 'Recorded vote: AYE — Your vote is final.', 'success');
                          }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            myVote === 'AYE'
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg'
                              : myVote
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                          }`}
                        >
                          AYE {myVote === 'AYE' && '✓'}
                        </button>
                        <button
                          type="button"
                          disabled={!!myVote}
                          onClick={() => {
                            onCastFlashVote(fv.id, student, 'NO');
                            onShowToast('Division Vote Cast', 'Recorded vote: NO — Your vote is final.', 'info');
                          }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            myVote === 'NO'
                              ? 'bg-rose-500 text-white border-rose-400 shadow-lg'
                              : myVote
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer'
                          }`}
                        >
                          NO {myVote === 'NO' && '✓'}
                        </button>
                        <button
                          type="button"
                          disabled={!!myVote}
                          onClick={() => {
                            onCastFlashVote(fv.id, student, 'ABSTAIN');
                            onShowToast('Division Vote Cast', 'Recorded vote: ABSTAIN — Your vote is final.', 'info');
                          }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            myVote === 'ABSTAIN'
                              ? 'bg-slate-600 text-white border-slate-500 shadow-lg'
                              : myVote
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20 cursor-pointer'
                          }`}
                        >
                          ABSTAIN {myVote === 'ABSTAIN' && '✓'}
                        </button>
                      </div>
                      {myVote && (
                        <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-semibold pt-1">
                          🔒 Your vote is final and cannot be changed
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1.5 Live Legislative Bills (Floor Division) */}
          {liveBills.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-5 md:p-6 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Legislative Bill Voting (Floor Division)
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-600 text-white animate-pulse">
                        VOTING OPEN
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Official House Vote on Introduced Bills • Cast your vote: AYE / NO / ABSTAIN
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0">
                  {liveBills.length} Active Bill{liveBills.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {liveBills.map(bill => {
                  const hasVoted = bill.voted_delegate_ids?.includes(student.id);
                  const myVote = bill.votes?.find(v => v.delegate_id === student.id)?.vote;

                  return (
                    <div key={bill.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-black text-purple-600 dark:text-purple-400 tracking-wider">
                            {bill.bill_number}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">{bill.title}</h4>
                          {bill.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {bill.description}
                            </p>
                          )}
                          {bill.proposer && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Introduced by: <span className="text-slate-700 dark:text-slate-300 font-semibold">{bill.proposer}</span>
                            </p>
                          )}
                        </div>
                        {hasVoted && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Voted{myVote ? `: ${myVote}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                          type="button"
                          disabled={hasVoted}
                          onClick={() => {
                            const res = storageService.castBillVote(bill.id, resolvedEventId, student, 'YES');
                            if (res.success) {
                              setSyncedBills(storageService.getBills(resolvedEventId));
                              onShowToast('Bill Vote Cast', `Your vote on ${bill.bill_number} was recorded as YES (AYE).`, 'success');
                            } else {
                              onShowToast('Vote Failed', res.error || 'You may have already voted or voting has closed.', 'error');
                            }
                          }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            myVote === 'YES'
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg'
                              : hasVoted
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                          }`}
                        >
                          AYE (YES) {myVote === 'YES' && '✓'}
                        </button>

                        <button
                          type="button"
                          disabled={hasVoted}
                          onClick={() => {
                            const res = storageService.castBillVote(bill.id, resolvedEventId, student, 'NO');
                            if (res.success) {
                              setSyncedBills(storageService.getBills(resolvedEventId));
                              onShowToast('Bill Vote Cast', `Your vote on ${bill.bill_number} was recorded as NO.`, 'info');
                            } else {
                              onShowToast('Vote Failed', res.error || 'You may have already voted or voting has closed.', 'error');
                            }
                          }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            myVote === 'NO'
                              ? 'bg-rose-500 text-white border-rose-400 shadow-lg'
                              : hasVoted
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer'
                          }`}
                        >
                          NO {myVote === 'NO' && '✓'}
                        </button>

                        <button
                          type="button"
                          disabled={hasVoted}
                          onClick={() => {
                            const res = storageService.castBillVote(bill.id, resolvedEventId, student, 'ABSTAIN');
                            if (res.success) {
                              setSyncedBills(storageService.getBills(resolvedEventId));
                              onShowToast('Bill Vote Cast', `Your vote on ${bill.bill_number} was recorded as ABSTAIN.`, 'info');
                            } else {
                              onShowToast('Vote Failed', res.error || 'You may have already voted or voting has closed.', 'error');
                            }
                          }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            myVote === 'ABSTAIN'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                              : hasVoted
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20 cursor-pointer'
                          }`}
                        >
                          ABSTAIN {myVote === 'ABSTAIN' && '✓'}
                        </button>
                      </div>

                      {hasVoted && (
                        <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-semibold pt-1">
                          🔒 Your division vote is final and cannot be altered
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Live Assembly Elections & Ballots */}
          {liveElections.length > 0 && onCastVote && (
            <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 md:p-6 shadow-xl space-y-6 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                    <Vote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Official Assembly Ballots (Live Now)
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white animate-pulse">
                        VOTING OPEN
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cast your official vote for House Leadership and Party Leader positions
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {liveElections.length} Active Ballot{liveElections.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-6">
                {liveElections.map((elec) => {
                  const eligibleCheck = isStudentEligibleForElection(elec);
                  const hasVoted = elec.voted_delegate_ids?.includes(student.id) || (elec as any).votedLearnerIds?.includes(student.id);

                  return (
                    <div
                      key={elec.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{elec.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Official Floor Ballot • Cast your vote below
                          </p>
                        </div>

                        <div>
                          {hasVoted ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Ballot Cast
                            </span>
                          ) : eligibleCheck.eligible ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 animate-pulse">
                              Your Vote Awaited
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                              Restricted Ballot
                            </span>
                          )}
                        </div>
                      </div>

                      {!eligibleCheck.eligible && (
                        <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3 font-semibold">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <span>{eligibleCheck.reason}</span>
                        </div>
                      )}

                      {/* Candidate Ballot Options - Only visible if eligible or already voted */}
                      {(eligibleCheck.eligible || hasVoted) && (
                        (!elec.candidates || elec.candidates.length === 0) ? (
                          <div className="p-4 text-center rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 italic">
                            Candidates for this election are being finalized by the Presiding Officer.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {elec.candidates.map((cand) => (
                              <div
                                key={cand.id}
                                className={`p-4 rounded-xl border space-y-3 transition-all ${
                                  hasVoted
                                    ? 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-80'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-500/60'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{cand.name}</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {cand.party} • <span className={cand.bench === 'Ruling' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{cand.bench} Bench</span>
                                    </p>
                                  </div>
                                </div>

                                {eligibleCheck.eligible && !hasVoted && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onCastVote(elec.id, cand.id, student.id);
                                      onShowToast('Vote Recorded', `You voted for ${cand.name} in ${elec.title}`, 'success');
                                    }}
                                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    <Vote className="w-4 h-4" /> Vote for {cand.name}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Empty State (Zero Active Ballots) */}
          {!hasLiveVoting && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-lg space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
                <Vote className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Ballots Right Now</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                  The House is currently in general session. When the Hon'ble Speaker calls for an election ballot or floor division vote, voting will open on this screen instantly.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Realtime Sync Active • No refresh needed</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: "MY DELEGATE DESK" 📋                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'desk' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Student Allocation Confirmation Card */}
          <StudentAllocationCard
            student={student}
            event={event}
            onShowToast={onShowToast}
          />

          {/* Delegate Assembly Pass Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 p-6 md:p-8 shadow-xl space-y-6 transition-colors">
            {/* Pass Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
                    Official Delegate Pass
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {event ? event.college_name : 'TN Legislative Assembly'}
                  </h2>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-emerald-500/30 text-center flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase text-emerald-700 dark:text-emerald-400 font-extrabold tracking-wider">
                  Verified MLA Delegate
                </span>
              </div>
            </div>

            {/* Delegate Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Avatar & Name */}
              <div className="space-y-3 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-6 md:pb-0 md:pr-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-amber-950/40 mx-auto md:mx-0">
                  {student.full_name.charAt(0)}
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{student.full_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{student.department} • <span className="text-amber-600 dark:text-amber-400 font-semibold">{student.academic_year}</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{student.email}</p>
                </div>
              </div>

              {/* Assembly Bench & Constituency */}
              <div className="space-y-4 md:col-span-2">
                
                {/* Role & Portfolio Highlight */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Assigned Legislative Role</span>
                  <p className="text-base font-extrabold text-amber-600 dark:text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{student.role || 'Member of Legislative Assembly (MLA)'}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Bench & Party */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Bench Position</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        isRuling
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}>
                        {student.bench || 'DELEGATE'}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{student.party_name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* TN Constituency */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" /> TN Assembly Constituency
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {student.constituency_number !== undefined ? `#${student.constituency_number} ` : ''}
                      {student.constituency_name || 'Unassigned'}
                    </p>
                  </div>

                </div>

                {/* Committee Room */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-500" /> Legislative Committee Room
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {student.committee_name || 'Unassigned Committee'}
                  </p>
                  {committee?.topic && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">Topic: "{committee.topic}"</p>
                  )}
                </div>

                {/* Coordination Group Links */}
                {(student.party_group_link || party?.whatsapp_group_link || student.committee_group_link) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {(student.party_group_link || party?.whatsapp_group_link) && (
                      <a
                        href={student.party_group_link || party?.whatsapp_group_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <span>💬 Party Group Chat</span>
                      </a>
                    )}
                    {student.committee_group_link && (
                      <a
                        href={student.committee_group_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1.5"
                      >
                        <span>📂 Committee Group Workspace</span>
                      </a>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Interactive Assembly Floor Request */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Hand className="w-5 h-5 text-amber-500" /> Request Assembly Floor Time
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit a Point of Order or speech request to the Assembly Speaker during live debates
              </p>
            </div>

            <button
              type="button"
              onClick={handleRequestFloor}
              disabled={floorRequested}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                floorRequested
                  ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-950/50'
              }`}
            >
              {floorRequested ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Request Sent to Speaker!
                </>
              ) : (
                <>
                  <Hand className="w-4 h-4" /> Raise Point of Order
                </>
              )}
            </button>
          </div>

          {/* Overview & Narrative Card ("Your Day in the House") */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" /> Overview: Your Day in the House
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {event?.dates || 'Day 1 Session'}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              Hon'ble Member <strong className="text-slate-900 dark:text-white font-bold">{student.full_name}</strong> representing constituency <strong className="text-amber-500">{student.constituency_name || 'TN State General'}</strong> on the <strong className={isRuling ? 'text-emerald-500' : 'text-rose-500'}>{student.bench || 'Ruling'} Bench</strong>. You are scheduled to participate in Question Hour, floor motions, committee room discussions ({student.committee_name || 'Standing Committee'}), and electronic division voting.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assembly Venue</span>
                <p className="font-bold text-slate-900 dark:text-white">{event?.location || 'Main Assembly Chamber'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Stage</span>
                <p className="font-bold text-amber-500">{event?.event_stage || 'State Assembly Round'}</p>
              </div>
            </div>
          </div>

          {/* Candidacy Nominations Section */}
          {isAssignedSpeakerOrDeputySpeaker ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Presiding Officer Neutrality
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 font-mono">
                        {student.role || 'Speaker / Deputy Speaker'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Assembly Presiding Officers maintain institutional neutrality
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Presiding Role
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                As the designated <strong>Speaker / Deputy Speaker</strong> of the Assembly, you preside over the house. Under assembly constitutional convention, presiding officers maintain institutional neutrality and cannot file nominations for elected positions.
              </p>
            </div>
          ) : openNominationPositions.length > 0 && onFileNomination ? (
            availableNominationPositions.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-4 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Parliamentary Candidacy Nominations
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
                          OPEN NOW
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Open positions: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{openNominationPositions.join(', ')}</span> • <span className="text-slate-400">1 nomination per member per post</span>
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleStudentNominationSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Select Open Position *
                      </label>
                      <select
                        value={selectedNomPosition}
                        onChange={(e) => setSelectedNomPosition(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        {availableNominationPositions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Candidate Name & Bench
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${student.full_name} (${student.party_name || 'Independent'} • ${student.bench || 'Delegate'})`}
                        className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Manifesto / Candidacy Statement *
                    </label>
                    <textarea
                      rows={3}
                      value={nomManifesto}
                      onChange={(e) => setNomManifesto(e.target.value)}
                      placeholder="Share your goals, vision for the assembly, and proposed reforms..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={nomSubmitted}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                        nomSubmitted
                          ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/50'
                      }`}
                    >
                      {nomSubmitted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Nomination Filed!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Submit Nomination
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-3 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Parliamentary Candidacy Nominations
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                          NOMINATED
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Open positions: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{openNominationPositions.join(', ')}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">
                      You have filed your nomination for all currently open position(s).
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Assembly rules permit each member to be eligible <strong>only one time</strong> to nominate for a post. Your filed nomination is active and displayed below.
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300">Nominations Currently Closed</h5>
                  <p className="text-[11px] text-slate-500">The Assembly Coordinator will open nomination windows for Speaker and Leadership during proceedings.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                Awaiting Open
              </span>
            </div>
          )}

          {/* Student's Own Filed Nomination Status */}
          {myNominations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  {myNominations.length > 1 ? 'Your Filed Nominations' : 'Your Filed Nomination'}
                </h4>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {myNominations.length} {myNominations.length > 1 ? 'Nominations Active' : 'Nomination Active'}
                </span>
              </div>
              <div className="space-y-2.5">
                {myNominations.map(myNom => (
                  <div key={myNom.id} className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{myNom.position}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          myNom.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : myNom.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          {myNom.status || 'Submitted'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{myNom.party_name} • {myNom.bench} Bench</span>
                    </div>
                    {myNom.manifesto && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{myNom.manifesto}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Hour & Submissions Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Parliamentary Question Hour</span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-500" /> Draft & Submit Parliamentary Question
                </h3>
              </div>

              {/* Deadline Status Banner */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 ${
                isQuestionWindowOpen
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                {isQuestionWindowOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isQuestionWindowOpen ? '🟢 Open for Submissions' : '🔴 Submission Window Closed'}</span>
              </div>
            </div>

            {/* Clear Status Notice */}
            {!isQuestionWindowOpen ? (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Question Submissions Closed</h4>
                  <p className="text-[11px] text-rose-600/90 dark:text-rose-400 mt-0.5 font-medium">
                    The Speaker / Organizer has locked the submission window. Questions cannot be drafted or submitted at this time.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0">
                  <Unlock className="w-4 h-4 animate-pulse" />
                </div>
                <p className="text-xs font-bold">
                  Question Hour submissions are <strong className="font-extrabold text-emerald-600 dark:text-emerald-400">ACTIVE & OPEN</strong>. Submit your parliamentary questions for the Cabinet Ministers below.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Ministry</label>
                  <select
                    disabled={!isQuestionWindowOpen || isMinistriesLoading || eventMinistries.length === 0 || isSubmittingQuestion}
                    value={questionMinistry}
                    onChange={(e) => setQuestionMinistry(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMinistriesLoading ? (
                      <option value="" disabled>Loading ministries...</option>
                    ) : eventMinistries.length === 0 ? (
                      <option value="" disabled>No ministries configured for this event.</option>
                    ) : (
                      eventMinistries.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Question Type</label>
                  <select
                    disabled={!isQuestionWindowOpen || isSubmittingQuestion}
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Standard">Standard Question</option>
                    <option value="Starred">Starred (Oral Answer)</option>
                    <option value="Unstarred">Unstarred (Written Answer)</option>
                    <option value="Zero Hour">Zero Hour Notice</option>
                    <option value="Calling Attention">Calling Attention</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Submitting Delegate</label>
                  <input
                    type="text"
                    readOnly
                    value={`${student.full_name} (${student.bench || 'Ruling'} Bench)`}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Question Text & Details *</label>
                <textarea
                  rows={3}
                  required
                  disabled={!isQuestionWindowOpen || isSubmittingQuestion}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={isQuestionWindowOpen ? "State your question clearly for the Minister during Question Hour..." : "Question submission window is currently closed by the Speaker / Admin."}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-400">
                  Status: <strong className={isQuestionWindowOpen ? "text-emerald-500 font-extrabold" : "text-rose-500 font-extrabold"}>{isQuestionWindowOpen ? 'Open for Submissions' : 'Submission Window Closed'}</strong>
                </span>

                <button
                  type="submit"
                  disabled={!isQuestionWindowOpen || !questionText.trim() || eventMinistries.length === 0 || isSubmittingQuestion}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingQuestion ? 'Submitting...' : 'Submit Question'}</span>
                </button>
              </div>
            </form>

            {/* Questions Tracker & Approved Questions View */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {isMinister && (
                  <button
                    type="button"
                    onClick={() => setQuestionViewMode('portfolio')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      questionViewMode === 'portfolio'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Questions for Your Ministry ({ministerQuestions.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQuestionViewMode('my_questions')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionViewMode === 'my_questions'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Your Submitted Questions ({studentQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionViewMode('approved_house')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionViewMode === 'approved_house'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Approved House Questions ({approvedHouseQuestions.length})
                </button>
              </div>

              {questionViewMode === 'portfolio' ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          {student.role} Portfolio Question Box
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                            {ministerQuestions.length} Approved
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Approved parliamentary questions tabled for your ministerial oral / written answer during Question Hour
                        </p>
                      </div>
                    </div>
                  </div>

                  {ministerQuestions.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No questions currently approved for {ministerInfo?.ministryShort || 'your ministry'}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                        Questions submitted by delegates and approved by the Speaker for your portfolio will appear here immediately.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ministerQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                #{q.queue_order || idx + 1}
                              </span>
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {q.student_name}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                q.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                              }`}>
                                {q.bench} Bench
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                {q.constituency}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {q.question_type}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                                {q.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewingQuestion(q)}
                                title="Expand / View Full Question"
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> Full View
                              </button>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-xs font-sans whitespace-pre-wrap break-words leading-relaxed text-slate-800 dark:text-slate-200 select-text">
                            {q.question_text}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                            <span>Target Ministry: <strong className="text-amber-600 dark:text-amber-400 font-bold">{q.ministry}</strong></span>
                            {q.created_at && (
                              <span className="font-mono">{new Date(q.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : questionViewMode === 'my_questions' ? (
                studentQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">You haven't submitted any questions for Question Hour yet.</p>
                ) : (
                  <div className="space-y-2">
                    {studentQuestions.map(q => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{q.ministry} • {q.question_type}</span>
                          <div className="flex items-center gap-2">
                            {q.created_at && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              q.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : q.status === 'Starred'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : q.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}>
                              {q.status === 'Submitted' ? 'Pending Approval' : q.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingQuestion(q)}
                              title="Expand / View Full Question"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{q.question_text}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                approvedHouseQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No approved questions for Question Hour yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {approvedHouseQuestions.map(q => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{q.ministry} • {q.question_type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">By: {q.student_name} ({q.constituency})</span>
                            <button
                              type="button"
                              onClick={() => setViewingQuestion(q)}
                              title="Expand / View Full Question"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{q.question_text}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: "ASSEMBLY AGENDA" 📅                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'agenda' && (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          
          {/* Highlighted IN PROGRESS current agenda item at the top */}
          {currentAgendaItem?.is_current && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-teal-500/10 border-2 border-emerald-500/50 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                    CURRENT PROCEEDING IN PROGRESS
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {currentAgendaItem.day} • {currentAgendaItem.time} ({currentAgendaItem.duration_minutes || 30} min)
                </span>
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {currentAgendaItem.title}
                </h4>
                {currentAgendaItem.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {currentAgendaItem.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                {currentAgendaItem.speaker_role && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30">
                    Chair/Speaker: {currentAgendaItem.speaker_role}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  {currentAgendaItem.category || 'General'}
                </span>
              </div>
            </div>
          )}

          {/* Schedule Viewer Header with Segmented Filter by Day */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Assembly Schedule
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredAgendaItems.length} Sessions
              </span>
            </div>

            {/* Segmented Filter: [Pre-Event] [Day 1] [Day 2] [All] */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              {(['Pre-Event', 'Day 1', 'Day 2', 'All'] as const).map(day => {
                const count = day === 'All' ? studentAgenda.length : studentAgenda.filter(a => a.day === day).length;
                const isSelected = agendaDayFilter === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setAgendaDayFilter(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{day}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Session List (Virtualized/Paginated-style smooth scrollable container) */}
          <div className="space-y-3">
            {isAgendaLoading && studentAgenda.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading assembly agenda on demand...</span>
              </div>
            ) : filteredAgendaItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                No agenda sessions scheduled for {agendaDayFilter}.
              </div>
            ) : (
              <>
                {/* Active & Upcoming Sessions */}
                <div className="space-y-3">
                  {activeOrUpcomingAgendaItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.is_current
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                              {item.day} • {item.time}
                            </span>
                            {item.duration_minutes && (
                              <span className="text-[10px] font-mono text-slate-400">
                                ({item.duration_minutes}m)
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {item.category || 'General'}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h5>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.speaker_role && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              Led by: {item.speaker_role}
                            </p>
                          )}
                        </div>

                        {item.is_current ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0 flex items-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" /> Live Now
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                            {item.status || 'Upcoming'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collapsible Completed / Past Sessions */}
                {completedAgendaItems.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowCompletedSessions(!showCompletedSessions)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {showCompletedSessions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{showCompletedSessions ? 'Hide' : 'View'} Completed Sessions ({completedAgendaItems.length})</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">
                        {showCompletedSessions ? 'Click to collapse' : 'Collapsed by default'}
                      </span>
                    </button>

                    {showCompletedSessions && (
                      <div className="space-y-2.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                        {completedAgendaItems.map(item => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 opacity-70"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {item.day} • {item.time}
                                </span>
                                <h6 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {item.title}
                                </h6>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                                Completed
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

      {/* Complete Question Modal */}
      {viewingQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setViewingQuestion(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Parliamentary Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingQuestion(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Delegate</span>
                <p className="font-bold text-slate-900 dark:text-white">{viewingQuestion.student_name}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Bench</span>
                <span className={viewingQuestion.bench === 'Ruling' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {viewingQuestion.bench}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Constituency</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">{viewingQuestion.constituency}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Ministry</span>
                <p className="font-bold text-amber-600 dark:text-amber-400">{viewingQuestion.ministry}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{viewingQuestion.question_type}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <p className="font-bold text-emerald-600">{viewingQuestion.status}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Full Question Text
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-sans whitespace-pre-wrap break-words leading-relaxed text-slate-900 dark:text-slate-100 select-text max-h-[45vh] overflow-y-auto">
                {viewingQuestion.question_text}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
