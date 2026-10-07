import React, { useState, useMemo, useEffect } from 'react';
import type {
  ScoreRecord,
  Learner,
  ScoringSession,
  JuryEvaluation,
  JuryEvaluationAdjustment
} from '../../types';
import { storageService } from '../../services/storageService';
import {
  Grid,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Calendar,
  UserCheck,
  Award,
  Layers,
  Table as TableIcon,
  Trash2,
  AlertTriangle,
  Trophy,
  BarChart3,
  History,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Sparkles,
  Star,
  Shield,
  CheckSquare,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

interface ScoreGridTabProps {
  scores: ScoreRecord[];
  learners: Learner[];
  eventId: string;
  eventName?: string;
  userRole?: string;
  isSuperAdmin?: boolean;
  onSaveScore: (score: ScoreRecord) => void;
  onResetScores?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

// 6 Core Rubric Categories with weights
export const SCORING_CATEGORIES = [
  { id: 'ALL', name: 'All Categories', max: 100 },
  { id: 'research_constituency', name: 'Research & Constituency', max: 30, shortName: 'Research' },
  { id: 'relevance_agenda', name: 'Relevance to Agenda', max: 20, shortName: 'Agenda' },
  { id: 'communication_delivery', name: 'Communication & Delivery', max: 20, shortName: 'Delivery' },
  { id: 'parliamentary_conduct', name: 'Parliamentary Conduct', max: 12, shortName: 'Conduct' },
  { id: 'originality_preparation', name: 'Originality & Prep', max: 12, shortName: 'Originality' },
  { id: 'time_management', name: 'Time Management', max: 6, shortName: 'Time' },
  { id: 'total', name: 'Total Score (/100)', max: 100, shortName: 'Total' }
] as const;

export type CategoryId = (typeof SCORING_CATEGORIES)[number]['id'];
export type ScoreGridViewMode = 'leaderboard_session' | 'leaderboard_overall' | 'recognition' | 'matrix' | 'itemized' | 'adjustments';

/**
 * Evaluates whether a participant is active strictly from their actual record state.
 * Never infers status from check-ins, presence, bench, or whether a score exists.
 */
export const isParticipantActive = (learner?: Learner): boolean => {
  if (!learner) return true;
  return (
    learner.is_active !== false &&
    (learner as any).status !== 'Inactive' &&
    (learner as any).status !== 'inactive'
  );
};

/**
 * Extracts the specific rubric score from a ScoreRecord object.
 */
export const getCategoryScoreFromRecord = (rec: ScoreRecord, catId: string): number => {
  switch (catId) {
    case 'research_constituency':
      return Number(rec.research_constituency ?? rec.policy_knowledge ?? 0);
    case 'relevance_agenda':
      return Number(rec.relevance_agenda ?? rec.rebuttal_debate ?? 0);
    case 'communication_delivery':
      return Number(rec.communication_delivery ?? rec.oratory ?? 0);
    case 'parliamentary_conduct':
      return Number(rec.parliamentary_conduct ?? 0);
    case 'originality_preparation':
      return Number(rec.originality_preparation ?? 0);
    case 'time_management':
      return Number(rec.time_management ?? 0);
    case 'total':
      return Number(rec.total ?? 0);
    default:
      return 0;
  }
};

interface ItemizedScoreRow {
  key: string;
  recordId: string;
  learnerId: string;
  studentName: string;
  constituencyNumber?: number;
  constituencyName?: string;
  partyName: string;
  bench: string;
  accessCode?: string;
  isParticipantActive: boolean;
  juryId: string;
  juryName: string;
  sessionId: string;
  sessionName: string;
  categoryId: string;
  categoryName: string;
  score: number;
  maxScore: number;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
  remarks?: string;
}

export const ScoreGridTab: React.FC<ScoreGridTabProps> = ({
  scores,
  learners,
  eventId,
  eventName,
  userRole,
  isSuperAdmin,
  onSaveScore,
  onResetScores,
  onShowToast
}) => {
  // Navigation & View Mode: Supports Session Leaderboard, Overall Leaderboard, Matrix, Itemized, and Adjustments Trail
  const [viewMode, setViewMode] = useState<ScoreGridViewMode>('leaderboard_session');
  const [isTop40Only, setIsTop40Only] = useState<boolean>(true);

  // Modals & Reset State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isResetTestModalOpen, setIsResetTestModalOpen] = useState(false);
  const [typedTestConfirm, setTypedTestConfirm] = useState('');
  const [isDeletingTestScores, setIsDeletingTestScores] = useState(false);
  const [isTrailModalOpen, setIsTrailModalOpen] = useState(false);
  const [selectedTrailEvaluation, setSelectedTrailEvaluation] = useState<JuryEvaluation | null>(null);

  // Dedicated Event Jury Scoring Reset State (Admin Only)
  const [isResetJuryModalOpen, setIsResetJuryModalOpen] = useState(false);
  const [typedJuryConfirm, setTypedJuryConfirm] = useState('');
  const [isResettingJuryScoring, setIsResettingJuryScoring] = useState(false);

  // Dedicated Event Live Speaking Turns Reset State (Admin/Coordinator Only)
  const [isResetLiveSpeakingModalOpen, setIsResetLiveSpeakingModalOpen] = useState(false);
  const [typedLiveSpeakingConfirm, setTypedLiveSpeakingConfirm] = useState('');
  const [isResettingLiveSpeakingTurns, setIsResettingLiveSpeakingTurns] = useState(false);

  // Test Mode & Classification State
  const [testMode, setTestMode] = useState(() => storageService.getScoringTestMode(eventId));
  const [auditTick, setAuditTick] = useState<number>(0);
  const [isUnclassifiedModalOpen, setIsUnclassifiedModalOpen] = useState(false);
  const [unclassifiedCandidates, setUnclassifiedCandidates] = useState<any[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'candidates_only'>('candidates_only');
  const [isClassifying, setIsClassifying] = useState(false);
  const [resetScope, setResetScope] = useState<'all' | 'current_run'>('all');

  // Available Sessions & Juries
  const availableSessions = useMemo<ScoringSession[]>(() => {
    return storageService.getScoringSessions(eventId);
  }, [eventId]);

  const availableJuries = useMemo(() => {
    return storageService.getJury(eventId);
  }, [eventId]);

  // Filters State
  const [selectedParticipantStatus, setSelectedParticipantStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');
  const [selectedJuryFilter, setSelectedJuryFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryId>('ALL');
  const [selectedBenchFilter, setSelectedBenchFilter] = useState<string>('ALL');
  const [selectedCompletionFilter, setSelectedCompletionFilter] = useState<'ALL' | 'FULLY_SCORED' | 'PARTIALLY_SCORED'>('ALL');
  const [selectedAdjustmentFilter, setSelectedAdjustmentFilter] = useState<'ALL' | 'ADJUSTED' | 'NOT_ADJUSTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'score_desc' | 'score_asc' | 'updated_desc' | 'name_asc'>('score_desc');

  // Active Session for Leaderboard (defaults to selected filter, or the first available session)
  const activeSessionId = useMemo(() => {
    if (selectedSessionFilter !== 'ALL') return selectedSessionFilter;
    return availableSessions[0]?.id || 'zero_hour';
  }, [selectedSessionFilter, availableSessions]);

  // Learner lookup map
  const learnerMap = useMemo(() => {
    const map = new Map<string, Learner>();
    learners.forEach(l => map.set(l.id, l));
    return map;
  }, [learners]);

  // Filter raw scores strictly by eventId
  const eventScores = useMemo(() => {
    return scores.filter(s => !s.event_id || !eventId || s.event_id === eventId);
  }, [scores, eventId]);

  // Strictly compute counts of test vs real scores
  const testScoresCount = useMemo(() => {
    const rawTest = eventScores.filter(s => storageService.isTestScore(s)).length;
    const evalTest = storageService.getJuryEvaluations(eventId, undefined, undefined, undefined, true)
      .filter(e => e.is_test || storageService.isTestScore(e as any)).length;
    return Math.max(rawTest, evalTest);
  }, [eventScores, eventId]);

  const realScoresCount = useMemo(() => {
    return Math.max(0, eventScores.length - testScoresCount);
  }, [eventScores, testScoresCount]);

  // Sync test mode and audit when storage updates
  useEffect(() => {
    if (eventId) {
      storageService.setupRealtimeSync(eventId);
    }
    const handleSync = () => {
      setTestMode(storageService.getScoringTestMode(eventId));
      setAuditTick(t => t + 1);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('tn_assembly_storage_update', handleSync);
    window.addEventListener('tn_assembly_speaking_turn_update', handleSync);
    window.addEventListener('tn_assembly_speaking_update', handleSync);
    window.addEventListener('tn_assembly_jury_scoring_reset', handleSync);
    window.addEventListener('tn_assembly_scores_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('tn_assembly_storage_update', handleSync);
      window.removeEventListener('tn_assembly_speaking_turn_update', handleSync);
      window.removeEventListener('tn_assembly_speaking_update', handleSync);
      window.removeEventListener('tn_assembly_jury_scoring_reset', handleSync);
      window.removeEventListener('tn_assembly_scores_updated', handleSync);
    };
  }, [eventId]);

  const auditData = useMemo(() => {
    return storageService.getScoringDataAudit(eventId);
  }, [eventId, scores, auditTick, isDeletingTestScores, isClassifying]);

  // Authorization check for administrative score reset
  const isAuthorized = Boolean(
    isSuperAdmin ||
    userRole === 'super_admin' ||
    userRole === 'admin' ||
    userRole === 'organiser' ||
    !userRole ||
    userRole === 'coordinator'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Session Leaderboard
  // ──────────────────────────────────────────────────────────────────────────
  const sessionLeaderboardRows = useMemo(() => {
    const rows = storageService.getSessionLeaderboard(eventId, activeSessionId, {
      environment: testMode.isTestMode ? 'test' : 'live',
      testRunId: testMode.testRunId
    });
    return rows.filter(r => {
      // Participant status filter
      if (selectedParticipantStatus !== 'ALL') {
        const learner = learnerMap.get(r.learnerId);
        const active = isParticipantActive(learner);
        if (selectedParticipantStatus === 'ACTIVE' && !active) return false;
        if (selectedParticipantStatus === 'INACTIVE' && active) return false;
      }
      // Bench filter
      if (selectedBenchFilter !== 'ALL' && r.bench !== selectedBenchFilter) return false;
      // Completion filter
      if (selectedCompletionFilter !== 'ALL' && r.completionStatus !== selectedCompletionFilter) return false;
      // Adjustment filter
      if (selectedAdjustmentFilter === 'ADJUSTED' && r.adjustmentsCount === 0) return false;
      if (selectedAdjustmentFilter === 'NOT_ADJUSTED' && r.adjustmentsCount > 0) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = r.studentName.toLowerCase();
        const constNum = (r.constituencyNumber ?? '').toString();
        const constName = (r.constituencyName || '').toLowerCase();
        const party = (r.partyName || '').toLowerCase();
        if (!sName.includes(q) && !constNum.includes(q) && !constName.includes(q) && !party.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    eventId,
    activeSessionId,
    selectedParticipantStatus,
    selectedBenchFilter,
    selectedCompletionFilter,
    selectedAdjustmentFilter,
    searchQuery,
    learnerMap,
    eventScores,
    testMode.isTestMode,
    testMode.testRunId,
    auditTick
  ]);

  const displayedSessionLeaderboardRows = useMemo(() => {
    if (isTop40Only) {
      return sessionLeaderboardRows.slice(0, 40);
    }
    return sessionLeaderboardRows;
  }, [sessionLeaderboardRows, isTop40Only]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Overall Leaderboard
  // ──────────────────────────────────────────────────────────────────────────
  const overallLeaderboardRows = useMemo(() => {
    const rows = storageService.getOverallLeaderboard(eventId, {
      environment: testMode.isTestMode ? 'test' : 'live',
      testRunId: testMode.testRunId
    });
    return rows.filter(r => {
      // Participant status filter
      if (selectedParticipantStatus !== 'ALL') {
        const learner = learnerMap.get(r.learnerId);
        const active = isParticipantActive(learner);
        if (selectedParticipantStatus === 'ACTIVE' && !active) return false;
        if (selectedParticipantStatus === 'INACTIVE' && active) return false;
      }
      // Bench filter
      if (selectedBenchFilter !== 'ALL' && r.bench !== selectedBenchFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = r.studentName.toLowerCase();
        const constNum = (r.constituencyNumber ?? '').toString();
        const constName = (r.constituencyName || '').toLowerCase();
        const party = (r.partyName || '').toLowerCase();
        if (!sName.includes(q) && !constNum.includes(q) && !constName.includes(q) && !party.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    eventId,
    selectedParticipantStatus,
    selectedBenchFilter,
    searchQuery,
    learnerMap,
    eventScores,
    testMode.isTestMode,
    testMode.testRunId,
    auditTick
  ]);

  const displayedOverallLeaderboardRows = useMemo(() => {
    if (isTop40Only) {
      return overallLeaderboardRows.slice(0, 40);
    }
    return overallLeaderboardRows;
  }, [overallLeaderboardRows, isTop40Only]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Jury Recognition & Speech Impact
  // ──────────────────────────────────────────────────────────────────────────
  const [recogFilterTurn, setRecogFilterTurn] = useState<string>('ALL');
  const [recogTick, setRecogTick] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch authoritative scoring environment, speaking turns & jury recognitions on mount
    if (eventId) {
      storageService.syncScoringEnvironment(eventId).then(() => {
        setTestMode(storageService.getScoringTestMode(eventId));
        setRecogTick(t => t + 1);
        setAuditTick(t => t + 1);
      }).catch(() => {});
      storageService.fetchSpeakingTurns(eventId).then(() => { setRecogTick(t => t + 1); setAuditTick(t => t + 1); }).catch(() => {});
      storageService.fetchJurySpeechRecognitions(eventId).then(() => { setRecogTick(t => t + 1); setAuditTick(t => t + 1); }).catch(() => {});
    }

    const unsub = storageService.subscribe(() => { setRecogTick(t => t + 1); setAuditTick(t => t + 1); });
    const handleRecogUpdate = () => {
      setTestMode(storageService.getScoringTestMode(eventId));
      setRecogTick(t => t + 1);
      setAuditTick(t => t + 1);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('tn_assembly_jury_recognition_update', handleRecogUpdate);
      window.addEventListener('tn_assembly_current_speaker_changed', handleRecogUpdate);
      window.addEventListener('tn_assembly_speaking_turn_update', handleRecogUpdate);
      window.addEventListener('tn_assembly_speaking_update', handleRecogUpdate);
      window.addEventListener('tn_assembly_scoring_environment_update', handleRecogUpdate);
      window.addEventListener('storage', handleRecogUpdate);
    }
    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('tn_assembly_jury_recognition_update', handleRecogUpdate);
        window.removeEventListener('tn_assembly_current_speaker_changed', handleRecogUpdate);
        window.removeEventListener('tn_assembly_speaking_turn_update', handleRecogUpdate);
        window.removeEventListener('tn_assembly_speaking_update', handleRecogUpdate);
        window.removeEventListener('tn_assembly_scoring_environment_update', handleRecogUpdate);
        window.removeEventListener('storage', handleRecogUpdate);
      }
    };
  }, [eventId]);

  const mostRecognizedParticipants = useMemo(() => {
    const raw = storageService.getMostRecognizedParticipants(
      eventId,
      selectedSessionFilter !== 'ALL' ? selectedSessionFilter : undefined,
      {
        environment: testMode.isTestMode ? 'test' : 'live',
        testRunId: testMode.testRunId
      }
    );
    return raw.filter(p => {
      // Participant status filter
      if (selectedParticipantStatus !== 'ALL') {
        const learner = learnerMap.get(p.learnerId);
        const active = isParticipantActive(learner);
        if (selectedParticipantStatus === 'ACTIVE' && !active) return false;
        if (selectedParticipantStatus === 'INACTIVE' && active) return false;
      }
      // Bench filter
      if (selectedBenchFilter !== 'ALL' && p.bench !== selectedBenchFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = p.studentName.toLowerCase();
        const constNum = (p.constituencyNumber ?? '').toString();
        const constName = (p.constituencyName || '').toLowerCase();
        const party = (p.partyName || '').toLowerCase();
        if (!sName.includes(q) && !constNum.includes(q) && !constName.includes(q) && !party.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    eventId,
    selectedSessionFilter,
    selectedParticipantStatus,
    selectedBenchFilter,
    searchQuery,
    learnerMap,
    recogTick,
    testMode.isTestMode,
    testMode.testRunId,
    auditTick
  ]);

  const speechImpactSummaries = useMemo(() => {
    const raw = storageService.getSpeechImpactSummaries(
      eventId,
      selectedSessionFilter !== 'ALL' ? selectedSessionFilter : undefined,
      {
        environment: testMode.isTestMode ? 'test' : 'live',
        testRunId: testMode.testRunId
      }
    );
    return raw.filter(s => {
      // Participant status filter
      if (selectedParticipantStatus !== 'ALL') {
        const learner = learnerMap.get(s.learnerId);
        const active = isParticipantActive(learner);
        if (selectedParticipantStatus === 'ACTIVE' && !active) return false;
        if (selectedParticipantStatus === 'INACTIVE' && active) return false;
      }
      // Bench filter
      if (selectedBenchFilter !== 'ALL' && s.bench !== selectedBenchFilter) return false;
      // Jury filter
      if (selectedJuryFilter !== 'ALL') {
        const hasJury = s.jurorRecognitions.some(r => r.juryId === selectedJuryFilter || r.juryName === selectedJuryFilter);
        if (!hasJury) return false;
      }
      // Turn filter
      if (recogFilterTurn !== 'ALL' && s.speakingTurnId !== recogFilterTurn && `#${s.sequenceNumber}` !== recogFilterTurn) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = s.studentName.toLowerCase();
        const constNum = (s.constituencyNumber ?? '').toString();
        const constName = (s.constituencyName || '').toLowerCase();
        const sess = s.sessionName.toLowerCase();
        if (!sName.includes(q) && !constNum.includes(q) && !constName.includes(q) && !sess.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    eventId,
    selectedSessionFilter,
    selectedParticipantStatus,
    selectedBenchFilter,
    selectedJuryFilter,
    recogFilterTurn,
    searchQuery,
    learnerMap,
    recogTick,
    testMode.isTestMode,
    testMode.testRunId,
    auditTick
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: All Score Adjustments Trail
  // ──────────────────────────────────────────────────────────────────────────
  const allAdjustmentsLog = useMemo(() => {
    const evals = storageService.getJuryEvaluations(eventId);
    const adjs: Array<JuryEvaluationAdjustment & {
      learner_name: string;
      learner_id: string;
      session_id: string;
      session_name: string;
      constituency_number?: number;
      constituency_name?: string;
      party_name?: string;
      bench?: string;
      evaluation: JuryEvaluation;
    }> = [];

    evals.forEach(e => {
      (e.adjustments || []).forEach(adj => {
        adjs.push({
          ...adj,
          learner_name: e.learner_name,
          learner_id: e.learner_id,
          session_id: e.session_id,
          session_name: e.session_name,
          constituency_number: e.constituency_number,
          constituency_name: e.constituency_name,
          party_name: e.party_name,
          bench: e.bench,
          evaluation: e
        });
      });
    });

    return adjs
      .filter(adj => {
        if (selectedSessionFilter !== 'ALL' && adj.session_id !== selectedSessionFilter && adj.session_name !== selectedSessionFilter) {
          return false;
        }
        if (selectedJuryFilter !== 'ALL' && adj.juror_id !== selectedJuryFilter && adj.juror_name !== selectedJuryFilter) {
          return false;
        }
        if (selectedBenchFilter !== 'ALL' && adj.bench !== selectedBenchFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const lName = adj.learner_name.toLowerCase();
          const jName = (adj.juror_name || '').toLowerCase();
          const reason = adj.adjustment_reason.toLowerCase();
          if (!lName.includes(q) && !jName.includes(q) && !reason.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime());
  }, [eventId, selectedSessionFilter, selectedJuryFilter, selectedBenchFilter, searchQuery, eventScores]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Delegate Matrix Table (Primary Admin Result View)
  // ──────────────────────────────────────────────────────────────────────────
  const filteredScoreRecords = useMemo(() => {
    return eventScores
      .filter(s => !storageService.isTestScore(s))
      .filter(s => {
        // Participant status filter
        if (selectedParticipantStatus !== 'ALL') {
          const learner = learnerMap.get(s.learner_id);
          const active = isParticipantActive(learner);
          if (selectedParticipantStatus === 'ACTIVE' && !active) return false;
          if (selectedParticipantStatus === 'INACTIVE' && active) return false;
        }

        // Session filter
        if (selectedSessionFilter !== 'ALL') {
          if (s.session_id !== selectedSessionFilter && s.session_name !== selectedSessionFilter) return false;
        }

        // Jury filter
        if (selectedJuryFilter !== 'ALL') {
          if (s.jury_id !== selectedJuryFilter && s.juror_name !== selectedJuryFilter) return false;
        }

        // Bench filter
        if (selectedBenchFilter !== 'ALL') {
          if (s.bench !== selectedBenchFilter) return false;
        }

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const learner = learnerMap.get(s.learner_id);
          const sName = (s.learner_name || learner?.full_name || '').toLowerCase();
          const jName = (s.juror_name || s.jury_id || '').toLowerCase();
          const sess = (s.session_name || '').toLowerCase();
          const constNum = (s.constituency_number ?? learner?.constituency_number ?? '').toString();
          const constName = (s.constituency_name || learner?.constituency_name || '').toLowerCase();
          if (
            !sName.includes(q) &&
            !jName.includes(q) &&
            !sess.includes(q) &&
            !constNum.includes(q) &&
            !constName.includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'score_desc') {
          if (selectedCategoryFilter !== 'ALL') {
            return getCategoryScoreFromRecord(b, selectedCategoryFilter) - getCategoryScoreFromRecord(a, selectedCategoryFilter);
          }
          return (b.total ?? 0) - (a.total ?? 0);
        }
        if (sortOption === 'score_asc') {
          if (selectedCategoryFilter !== 'ALL') {
            return getCategoryScoreFromRecord(a, selectedCategoryFilter) - getCategoryScoreFromRecord(b, selectedCategoryFilter);
          }
          return (a.total ?? 0) - (b.total ?? 0);
        }
        if (sortOption === 'updated_desc') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        return (a.learner_name || '').localeCompare(b.learner_name || '');
      });
  }, [
    eventScores,
    selectedParticipantStatus,
    selectedSessionFilter,
    selectedJuryFilter,
    selectedCategoryFilter,
    selectedBenchFilter,
    searchQuery,
    sortOption,
    learnerMap
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: Detailed Itemized Log (Audit & Verification)
  // ──────────────────────────────────────────────────────────────────────────
  const allItemizedRows = useMemo<ItemizedScoreRow[]>(() => {
    const rows: ItemizedScoreRow[] = [];

    eventScores.forEach(s => {
      const learner = learnerMap.get(s.learner_id);
      const studentName = s.learner_name || learner?.full_name || 'Delegate';
      const constituencyNumber = s.constituency_number ?? learner?.constituency_number;
      const constituencyName = s.constituency_name || learner?.constituency_name;
      const partyName = s.party_name || learner?.party_name || 'Independent';
      const bench = s.bench || learner?.bench || 'Ruling';
      const accessCode = learner?.access_code;
      const active = isParticipantActive(learner);
      const juryId = s.jury_id || 'unknown_jury';
      const juryName = s.juror_name || s.jury_id || 'Juror';
      const sessionId = s.session_id || 'unknown_session';
      const sessionName = s.session_name || 'Assembly Session';
      const totalScore = Number(s.total || 0);
      const createdAt = s.created_at || new Date().toISOString();
      const updatedAt = s.updated_at || createdAt;
      const remarks = s.feedback;

      SCORING_CATEGORIES.forEach(cat => {
        if (cat.id === 'ALL' || cat.id === 'total') return;
        const score = getCategoryScoreFromRecord(s, cat.id);
        rows.push({
          key: `${s.id}_${cat.id}`,
          recordId: s.id,
          learnerId: s.learner_id,
          studentName,
          constituencyNumber,
          constituencyName,
          partyName,
          bench,
          accessCode,
          isParticipantActive: active,
          juryId,
          juryName,
          sessionId,
          sessionName,
          categoryId: cat.id,
          categoryName: cat.name,
          score,
          maxScore: cat.max,
          totalScore,
          createdAt,
          updatedAt,
          remarks
        });
      });
    });

    return rows;
  }, [eventScores, learnerMap]);

  const filteredItemizedRows = useMemo(() => {
    return allItemizedRows
      .filter(row => {
        // Participant status
        if (selectedParticipantStatus !== 'ALL') {
          if (selectedParticipantStatus === 'ACTIVE' && !row.isParticipantActive) return false;
          if (selectedParticipantStatus === 'INACTIVE' && row.isParticipantActive) return false;
        }

        // Session filter
        if (selectedSessionFilter !== 'ALL') {
          if (row.sessionId !== selectedSessionFilter && row.sessionName !== selectedSessionFilter) {
            return false;
          }
        }

        // Jury filter
        if (selectedJuryFilter !== 'ALL') {
          if (row.juryId !== selectedJuryFilter && row.juryName !== selectedJuryFilter) {
            return false;
          }
        }

        // Category filter
        if (selectedCategoryFilter !== 'ALL') {
          if (row.categoryId !== selectedCategoryFilter) {
            return false;
          }
        }

        // Bench filter
        if (selectedBenchFilter !== 'ALL') {
          if (row.bench !== selectedBenchFilter) {
            return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = row.studentName.toLowerCase().includes(q);
          const matchesAccess = row.accessCode?.toLowerCase().includes(q) ?? false;
          const matchesConstNum = row.constituencyNumber?.toString().includes(q) ?? false;
          const matchesConstName = row.constituencyName?.toLowerCase().includes(q) ?? false;
          const matchesJury = row.juryName.toLowerCase().includes(q);
          const matchesSession = row.sessionName.toLowerCase().includes(q);
          const matchesCategory = row.categoryName.toLowerCase().includes(q);
          const matchesParty = row.partyName.toLowerCase().includes(q);

          if (
            !matchesName &&
            !matchesAccess &&
            !matchesConstNum &&
            !matchesConstName &&
            !matchesJury &&
            !matchesSession &&
            !matchesCategory &&
            !matchesParty
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'score_desc') return b.score - a.score;
        if (sortOption === 'score_asc') return a.score - b.score;
        if (sortOption === 'updated_desc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortOption === 'name_asc') return a.studentName.localeCompare(b.studentName);
        return 0;
      });
  }, [
    allItemizedRows,
    selectedParticipantStatus,
    selectedSessionFilter,
    selectedJuryFilter,
    selectedCategoryFilter,
    selectedBenchFilter,
    searchQuery,
    sortOption
  ]);

  // Stats Summary
  const stats = useMemo(() => {
    const validScores = eventScores.filter(s => !storageService.isTestScore(s));
    const totalRecords = validScores.length;
    const uniqueLearners = new Set(validScores.map(s => s.learner_id)).size;
    const uniqueJuries = new Set(validScores.map(s => s.juror_name || s.jury_id)).size;
    const uniqueSessions = new Set(validScores.map(s => s.session_id || s.session_name)).size;
    const totalAdjustments = allAdjustmentsLog.length;
    return { totalRecords, uniqueLearners, uniqueJuries, uniqueSessions, totalAdjustments };
  }, [eventScores, allAdjustmentsLog]);

  // Handler to open adjustment trail modal
  const handleOpenTrailModal = (learnerId: string, sessionId?: string) => {
    const targetSession = sessionId || activeSessionId;
    const evals = storageService.getJuryEvaluations(eventId, targetSession, undefined, learnerId);
    if (evals.length > 0) {
      setSelectedTrailEvaluation(evals[0]);
      setIsTrailModalOpen(true);
    } else {
      onShowToast('No Evaluation Record', 'No evaluation details found for this participant.', 'info');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // CSV Export
  // ──────────────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (viewMode === 'leaderboard_session') {
      if (displayedSessionLeaderboardRows.length === 0) {
        onShowToast('No Records', 'No session leaderboard records to export.', 'info');
        return;
      }
      const headers = [
        'Rank',
        'Student Name',
        'Constituency #',
        'Constituency Name',
        'Party',
        'Bench',
        'Session Score',
        'Jurors Scored',
        'Expected Jurors',
        'Completion Status',
        'Speaking Turns',
        'Research Avg',
        'Agenda Avg',
        'Delivery Avg',
        'Conduct Avg',
        'Originality Avg',
        'Time Avg',
        'Adjustments Count'
      ];
      const rows = displayedSessionLeaderboardRows.map(r => [
        r.rank,
        `"${r.studentName.replace(/"/g, '""')}"`,
        r.constituencyNumber ?? '',
        `"${(r.constituencyName || '').replace(/"/g, '""')}"`,
        `"${r.partyName.replace(/"/g, '""')}"`,
        r.bench,
        r.sessionScore,
        r.jurorCount,
        r.expectedJurors,
        r.completionStatus,
        r.speakingTurnCount,
        r.avgResearch,
        r.avgRelevance,
        r.avgComm,
        r.avgConduct,
        r.avgOrig,
        r.avgTime,
        r.adjustmentsCount
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Session_Leaderboard_${activeSessionId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Export Complete', `Exported ${displayedSessionLeaderboardRows.length} session leaderboard rows.`, 'success');
      return;
    }

    if (viewMode === 'leaderboard_overall') {
      if (displayedOverallLeaderboardRows.length === 0) {
        onShowToast('No Records', 'No overall leaderboard records to export.', 'info');
        return;
      }
      const headers = [
        'Rank',
        'Student Name',
        'Constituency #',
        'Constituency Name',
        'Party',
        'Bench',
        'Overall Score',
        'Sessions Evaluated',
        'Total Juror Evaluations',
        'Speaking Turns'
      ];
      const rows = displayedOverallLeaderboardRows.map(r => [
        r.rank,
        `"${r.studentName.replace(/"/g, '""')}"`,
        r.constituencyNumber ?? '',
        `"${(r.constituencyName || '').replace(/"/g, '""')}"`,
        `"${r.partyName.replace(/"/g, '""')}"`,
        r.bench,
        r.overallScore,
        r.sessionsEvaluatedCount,
        r.totalJurorEvaluationsCount,
        r.speakingTurnCount
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Overall_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Export Complete', `Exported ${displayedOverallLeaderboardRows.length} overall leaderboard rows.`, 'success');
      return;
    }

    if (viewMode === 'adjustments') {
      if (allAdjustmentsLog.length === 0) {
        onShowToast('No Records', 'No score adjustments logged to export.', 'info');
        return;
      }
      const headers = [
        'Delegate',
        'Session',
        'Juror',
        'Previous Total',
        'New Total',
        'Delta Total',
        'Adjustment Reason',
        'Adjusted At'
      ];
      const rows = allAdjustmentsLog.map(a => [
        `"${a.learner_name.replace(/"/g, '""')}"`,
        `"${a.session_name.replace(/"/g, '""')}"`,
        `"${(a.juror_name || '').replace(/"/g, '""')}"`,
        a.previous_total,
        a.new_total,
        a.delta_total,
        `"${a.adjustment_reason.replace(/"/g, '""')}"`,
        a.adjusted_at
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Score_Adjustments_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Export Complete', `Exported ${allAdjustmentsLog.length} score adjustments to CSV.`, 'success');
      return;
    }

    if (viewMode === 'matrix') {
      if (filteredScoreRecords.length === 0) {
        onShowToast('No Records', 'No score records match the selected filters to export.', 'info');
        return;
      }

      const headers = [
        'Delegate',
        'Constituency #',
        'Constituency Name',
        'Party',
        'Bench',
        'Participant Status',
        'Session',
        'Juror',
        'Research (30)',
        'Agenda (20)',
        'Delivery (20)',
        'Conduct (12)',
        'Originality (12)',
        'Time (6)',
        'Total (/100)',
        'Remarks',
        'Updated At'
      ];

      const rows = filteredScoreRecords.map(sc => {
        const learner = learnerMap.get(sc.learner_id);
        return [
          `"${(sc.learner_name || learner?.full_name || 'Delegate').replace(/"/g, '""')}"`,
          sc.constituency_number ?? learner?.constituency_number ?? '',
          `"${(sc.constituency_name || learner?.constituency_name || '').replace(/"/g, '""')}"`,
          `"${(sc.party_name || learner?.party_name || '').replace(/"/g, '""')}"`,
          sc.bench || learner?.bench || '',
          learner && isParticipantActive(learner) ? 'Active' : 'Inactive',
          `"${(sc.session_name || 'Session').replace(/"/g, '""')}"`,
          `"${(sc.juror_name || 'Juror').replace(/"/g, '""')}"`,
          sc.research_constituency ?? sc.policy_knowledge ?? 0,
          sc.relevance_agenda ?? sc.rebuttal_debate ?? 0,
          sc.communication_delivery ?? sc.oratory ?? 0,
          sc.parliamentary_conduct ?? 0,
          sc.originality_preparation ?? 0,
          sc.time_management ?? 0,
          sc.total,
          `"${(sc.feedback || '').replace(/"/g, '""')}"`,
          sc.updated_at
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Delegate_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast('Export Complete', `Exported ${filteredScoreRecords.length} delegate matrix records to CSV.`, 'success');
      return;
    }

    if (filteredItemizedRows.length === 0) {
      onShowToast('No Records', 'No score records match the selected filters to export.', 'info');
      return;
    }

    const headers = [
      'Student Name',
      'Constituency #',
      'Constituency Name',
      'Party',
      'Bench',
      'Participant Status',
      'Jury',
      'Session',
      'Category',
      'Score',
      'Max Score',
      'Total Score /100',
      'Created At',
      'Updated At',
      'Juror Remarks'
    ];

    const rows = filteredItemizedRows.map(r => [
      `"${r.studentName.replace(/"/g, '""')}"`,
      r.constituencyNumber ?? '',
      `"${(r.constituencyName || '').replace(/"/g, '""')}"`,
      `"${(r.partyName || '').replace(/"/g, '""')}"`,
      r.bench,
      r.isParticipantActive ? 'Active' : 'Inactive',
      `"${r.juryName.replace(/"/g, '""')}"`,
      `"${r.sessionName.replace(/"/g, '""')}"`,
      `"${r.categoryName.replace(/"/g, '""')}"`,
      r.score,
      r.maxScore,
      r.totalScore,
      r.createdAt,
      r.updatedAt,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jury_Itemized_Scores_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Export Complete', `Exported ${filteredItemizedRows.length} itemized score records to CSV.`, 'success');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Test Scores Reset Controls & Test Mode Handlers
  // ──────────────────────────────────────────────────────────────────────────
  const isLikelyTestCandidate = (c: any) => {
    const name = (c.learner_name || '').toLowerCase();
    const juror = (c.jury_name || '').toLowerCase();
    const created = c.created_at || '';
    if (created.startsWith('2026-10-02') || created.includes('2026-10-02')) return { isLikely: true, reason: 'Created Oct 2, 2026' };
    if (name.includes('test') || name.includes('demo') || juror.includes('test') || juror.includes('demo')) {
      return { isLikely: true, reason: 'Contains test keyword' };
    }
    const knownTestNames = ['vishnu karthika', 'anu sri', 'rithika', 'monika', 'kamali'];
    if (knownTestNames.some(kn => name.includes(kn))) {
      return { isLikely: true, reason: 'Matching test delegate' };
    }
    return { isLikely: false, reason: '' };
  };

  const processedCandidates = useMemo(() => {
    return unclassifiedCandidates.map(c => {
      const check = isLikelyTestCandidate(c);
      return {
        ...c,
        isLikelyTest: check.isLikely,
        suspectReason: check.reason
      };
    });
  }, [unclassifiedCandidates]);

  const displayedCandidates = useMemo(() => {
    if (candidateFilter === 'candidates_only') {
      return processedCandidates.filter(c => c.isLikelyTest);
    }
    return processedCandidates;
  }, [processedCandidates, candidateFilter]);

  const suspectedCandidatesCount = useMemo(() => {
    return processedCandidates.filter(c => c.isLikelyTest).length;
  }, [processedCandidates]);

  const handleToggleTestMode = () => {
    if (!eventId) return;
    try {
      const nextMode = !testMode.isTestMode;
      const updated = storageService.setScoringTestMode(eventId, nextMode);
      setTestMode(updated);
      onShowToast(
        updated.isTestMode ? 'Test Mode Activated' : 'Live Production Active',
        updated.isTestMode
          ? `Scoring is now running in Test Mode with Run ID: ${updated.testRunId}. New evaluations are tagged as test records.`
          : 'Scoring is now running in Live Production mode. Official scores will be saved.',
        updated.isTestMode ? 'info' : 'success'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to toggle scoring test mode.', 'error');
    }
  };

  const handleStartNewTestRun = async () => {
    if (!eventId) return;
    try {
      const newRunId = await storageService.startNewTestRun(eventId);
      setTestMode({ isTestMode: true, testRunId: newRunId });
      onShowToast(
        'New Test Run Started',
        `Active Test Run ID updated to: ${newRunId}. Previous test data remains distinct.`,
        'info'
      );
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to start new test run.', 'error');
    }
  };

  const handleOpenUnclassifiedModal = () => {
    if (!eventId) return;
    const candidates = storageService.getUnclassifiedTestCandidates(eventId);
    setUnclassifiedCandidates(candidates);
    const preselected = new Set<string>();
    candidates.forEach(c => {
      if (isLikelyTestCandidate(c).isLikely) {
        preselected.add(c.id);
      }
    });
    setSelectedCandidateIds(preselected);
    setIsUnclassifiedModalOpen(true);
  };

  const handleToggleCandidateSelect = (id: string) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllDisplayedCandidates = () => {
    setSelectedCandidateIds(new Set(displayedCandidates.map(c => c.id)));
  };

  const handleClassifySelected = async () => {
    if (!eventId || selectedCandidateIds.size === 0) return;
    setIsClassifying(true);
    try {
      const res = await storageService.classifyScoresAsTest(
        eventId,
        Array.from(selectedCandidateIds),
        testMode.testRunId || undefined
      );
      onShowToast(
        'Scores Classified as Test Data',
        `Successfully classified ${res.convertedCount} score(s) as test data. They can now be cleanly purged via Reset Test Scores.`,
        'success'
      );
      setSelectedCandidateIds(new Set());
      setIsUnclassifiedModalOpen(false);
      setAuditTick(t => t + 1);
      if (onResetScores) {
        onResetScores();
      }
    } catch (err: any) {
      onShowToast('Classification Failed', err?.message || 'Could not classify selected scores.', 'error');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleOpenResetTestModal = () => {
    if (!isAuthorized) {
      onShowToast('Unauthorized', 'Only administrators are authorized to reset jury scores.', 'error');
      return;
    }
    const currentTestCount =
      auditData.testData.evaluations +
      auditData.testData.recognitions +
      auditData.testData.turns +
      auditData.testData.adjustments +
      (auditData.testData.testFloorTurns || 0);

    if (currentTestCount === 0 && testScoresCount === 0 && !testMode.isTestMode) {
      onShowToast(
        'No Test Data Found',
        `No test scores, recognitions, or test turns found for this event. Real production data is completely protected.`,
        'info'
      );
      return;
    }
    setTypedTestConfirm('');
    setIsResetTestModalOpen(true);
  };

  const handleConfirmDeleteTestScores = async () => {
    if (!eventId) {
      onShowToast('Unable to reset test scores. No score data was changed.', 'Missing event identifier.', 'error');
      return;
    }
    if (typedTestConfirm !== 'RESET TEST RUN') {
      onShowToast('Confirmation Required', 'You must type "RESET TEST RUN" exactly to confirm.', 'error');
      return;
    }
    setIsDeletingTestScores(true);
    try {
      const res = await storageService.resetTestScores(eventId, {
        testRunId: resetScope === 'current_run' ? (testMode.testRunId || undefined) : undefined,
        resetAll: resetScope === 'all'
      });
      setIsResetTestModalOpen(false);
      setTypedTestConfirm('');
      setAuditTick(t => t + 1);
      if (res.deletedCount > 0) {
        onShowToast(
          `${res.deletedCount} test score${res.deletedCount > 1 ? 's' : ''} removed`,
          `${res.deletedCount} test records were removed. ${res.remainingRealCount} real production scores were preserved.`,
          'success'
        );
      } else {
        onShowToast(
          'Reset completed — 0 scores removed',
          'No test scores were found matching criteria. All production records remain untouched.',
          'info'
        );
      }
      if (onResetScores) {
        onResetScores();
      }
    } catch (err: any) {
      onShowToast(
        'Reset failed — no scores were removed.',
        err?.message || 'Database error occurred.',
        'error'
      );
    } finally {
      setIsDeletingTestScores(false);
    }
  };

  const handleConfirmResetLiveSpeakingTurns = async () => {
    if (!eventId) {
      onShowToast('Unable to reset live speaking turns', 'Missing event identifier.', 'error');
      return;
    }
    if (typedLiveSpeakingConfirm !== 'RESET LIVE TURNS') {
      onShowToast('Confirmation Required', 'You must type "RESET LIVE TURNS" exactly to proceed.', 'error');
      return;
    }
    setIsResettingLiveSpeakingTurns(true);
    try {
      const res = await storageService.resetLiveSpeakingTurns(eventId, {
        role: userRole,
        name: isSuperAdmin ? 'Super Admin' : 'Coordinator'
      });
      if (res.success) {
        setIsResetLiveSpeakingModalOpen(false);
        setTypedLiveSpeakingConfirm('');
        setAuditTick(t => t + 1);
        onShowToast(
          'Live Speaking Turns Reset',
          `Successfully reset all LIVE speaking turns for this event (${res.deletedTurnsCount} turn(s) deleted). Test data preserved (${res.remainingTestTurnsCount} test turn(s)).`,
          'success'
        );
      } else {
        onShowToast('Reset Failed', res.error || 'Failed to reset live speaking turns', 'error');
      }
    } catch (err: any) {
      onShowToast(
        'Reset failed',
        err?.message || 'Database error occurred while resetting live speaking turns.',
        'error'
      );
    } finally {
      setIsResettingLiveSpeakingTurns(false);
    }
  };

  const handleConfirmResetJuryScoring = async () => {
    if (!eventId) {
      onShowToast('Unable to reset jury scoring', 'Missing event identifier.', 'error');
      return;
    }
    if (typedJuryConfirm !== 'RESET JURY SCORES') {
      onShowToast('Confirmation Required', 'You must type "RESET JURY SCORES" exactly to proceed.', 'error');
      return;
    }
    setIsResettingJuryScoring(true);
    try {
      const res = await storageService.resetEventJuryScoring(eventId, {
        confirmationPhrase: typedJuryConfirm
      });
      setIsResetJuryModalOpen(false);
      setTypedJuryConfirm('');
      setAuditTick(t => t + 1);
      onShowToast(
        'Jury Scoring Reset Complete',
        `Successfully reset jury scoring for this event (${res.deletedLegacyScores || res.deletedEvaluations} scores removed). Speaking turns and participant records preserved.`,
        'success'
      );
      if (onResetScores) {
        onResetScores();
      }
    } catch (err: any) {
      onShowToast(
        'Reset Failed',
        err?.message || 'Error executing jury scoring reset.',
        'error'
      );
    } finally {
      setIsResettingJuryScoring(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Grade Modal State & Handlers
  // ──────────────────────────────────────────────────────────────────────────
  const [modalStudentId, setModalStudentId] = useState<string>('');
  const [modalSessionId, setModalSessionId] = useState<string>(availableSessions[0]?.id || 'zero_hour');
  const [modalJuryName, setModalJuryName] = useState<string>(availableJuries[0]?.name || 'Jury 1');
  const [modalResearch, setModalResearch] = useState<number>(20);
  const [modalRelevance, setModalRelevance] = useState<number>(14);
  const [modalComm, setModalComm] = useState<number>(14);
  const [modalConduct, setModalConduct] = useState<number>(8);
  const [modalOriginality, setModalOriginality] = useState<number>(8);
  const [modalTime, setModalTime] = useState<number>(4);
  const [modalRemarks, setModalRemarks] = useState<string>('');
  const [modalIsTest, setModalIsTest] = useState<boolean>(false);

  const modalTotal = modalResearch + modalRelevance + modalComm + modalConduct + modalOriginality + modalTime;

  const handleGradeModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalStudentId) {
      onShowToast('Student Required', 'Please select a delegate participant to score.', 'error');
      return;
    }

    const targetLearner = learnerMap.get(modalStudentId);
    if (!targetLearner) {
      onShowToast('Invalid Student', 'Selected participant could not be verified in roster.', 'error');
      return;
    }

    const sessionObj = availableSessions.find(s => s.id === modalSessionId) || {
      id: modalSessionId,
      name: modalSessionId
    };

    const selectedJury = availableJuries.find(j => j.name === modalJuryName);
    const juryId = selectedJury?.id || modalJuryName.trim().toLowerCase().replace(/\s+/g, '_') || 'jury_admin';

    // Call authoritative evaluation engine
    const newEval = storageService.recordInitialEvaluation({
      eventId,
      sessionId: sessionObj.id,
      sessionName: sessionObj.name,
      learnerId: targetLearner.id,
      learnerName: targetLearner.full_name,
      constituencyNumber: targetLearner.constituency_number,
      constituencyName: targetLearner.constituency_name,
      partyName: targetLearner.party_name,
      bench: targetLearner.bench as any,
      juryId,
      juryName: modalJuryName,
      research_constituency: modalResearch,
      relevance_agenda: modalRelevance,
      communication_delivery: modalComm,
      parliamentary_conduct: modalConduct,
      originality_preparation: modalOriginality,
      time_management: modalTime,
      feedback: modalRemarks.trim(),
      isTest: modalIsTest
    });

    if (onSaveScore) {
      onSaveScore({
        id: newEval.id,
        event_id: newEval.event_id,
        session_id: newEval.session_id,
        session_name: newEval.session_name,
        learner_id: newEval.learner_id,
        learner_name: newEval.learner_name,
        constituency_number: newEval.constituency_number,
        constituency_name: newEval.constituency_name,
        party_name: newEval.party_name,
        bench: newEval.bench,
        jury_id: newEval.jury_id,
        juror_name: newEval.jury_name,
        research_constituency: newEval.research_constituency,
        relevance_agenda: newEval.relevance_agenda,
        communication_delivery: newEval.communication_delivery,
        parliamentary_conduct: newEval.parliamentary_conduct,
        originality_preparation: newEval.originality_preparation,
        time_management: newEval.time_management,
        total: newEval.total,
        feedback: newEval.feedback,
        is_test: newEval.is_test,
        created_at: newEval.created_at,
        updated_at: newEval.updated_at
      });
    }

    setIsGradeModalOpen(false);
    setModalStudentId('');
    setModalRemarks('');
    setModalIsTest(false);
    onShowToast(
      'Score Saved',
      `Saved evaluation ${modalTotal}/100 in ${sessionObj.name} for ${targetLearner.full_name}${modalIsTest ? ' (Marked as Test)' : ''}`,
      'success'
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-amber-500 bg-amber-500/10 border border-amber-500/20">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Jury Scoring & Assembly Leaderboards
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Session-isolated evaluations, speaking turn contributions, score adjustment audits, and live Top-40 leaderboards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Distinct Score Count Badges */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400">Production:</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{realScoresCount}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-400">Test:</span>
            <span className="font-mono font-black text-rose-500">{testScoresCount}</span>
          </div>

          {/* Reset Test Run button (Clearly separated: only deletes test data) */}
          <button
            type="button"
            onClick={handleOpenResetTestModal}
            disabled={isDeletingTestScores || (!testMode.isTestMode && auditData.testData.evaluations === 0 && auditData.testData.recognitions === 0 && auditData.testData.turns === 0 && (auditData.testData.testFloorTurns || 0) === 0 && testScoresCount === 0)}
            className="px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Safely remove test/demo score records without deleting real production scores"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Test Run</span>
          </button>

          {/* Reset Live Speaking Turns button (Clearly separated: only deletes LIVE speaking turns for current event) */}
          {isAuthorized && (
            <button
              type="button"
              onClick={() => {
                setTypedLiveSpeakingConfirm('');
                setIsResetLiveSpeakingModalOpen(true);
              }}
              disabled={isResettingLiveSpeakingTurns || (auditData.realData.liveFloorTurns === 0)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition cursor-pointer hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/50 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              title="Reset all LIVE speaking turns for this event (destructive, requires typed confirmation)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Live Speaking Turns</span>
            </button>
          )}

          {/* Dedicated Event Jury Scoring Reset Button (Administrator Only) */}
          {isAuthorized && (
            <button
              type="button"
              onClick={() => {
                setTypedJuryConfirm('');
                setIsResetJuryModalOpen(true);
              }}
              disabled={isResettingJuryScoring}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition cursor-pointer hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/50 shadow-xs"
              title="Reset all jury scoring activity for this event and start fresh"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Jury Scoring</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            title="Download CSV of currently displayed view"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGradeModalOpen(true)}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
            style={{ backgroundColor: 'var(--amber)' }}
          >
            <Plus className="w-4 h-4" />
            <span>+ Record New Score</span>
          </button>
        </div>
      </div>

      {/* Admin Test Mode & Test Data Management Controls */}
      {isAuthorized && (
        <div
          className={`rounded-2xl p-4 md:p-5 border shadow-sm transition-all ${
            testMode.isTestMode
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status & Operational Mode */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  Scoring Environment
                </span>
                {testMode.isTestMode ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    TEST MODE ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                    <Shield className="w-3.5 h-3.5" />
                    LIVE PRODUCTION MODE
                  </span>
                )}
                {testMode.testRunId && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                    Run ID: {testMode.testRunId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {testMode.isTestMode
                  ? 'All scores and recognitions entered in this browser are tagged with testRunId and can be cleanly purged without touching production data.'
                  : 'Scores and recognitions are entered as official production records. Real production scores are strictly protected.'}
              </p>
            </div>

            {/* Mode Switching & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleToggleTestMode}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  testMode.isTestMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                    : 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500'
                }`}
              >
                {testMode.isTestMode ? (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    Switch to Live Production
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Switch to Test Run Mode
                  </>
                )}
              </button>

              {testMode.isTestMode && (
                <button
                  type="button"
                  onClick={handleStartNewTestRun}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                  style={{ borderColor: 'var(--border)' }}
                  title="Generate a new Test Run ID to isolate subsequent test evaluations"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  New Test Run ID
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenUnclassifiedModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                style={{ borderColor: 'var(--border)' }}
                title="Review scores that may have been created during manual testing and classify them"
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                Review Unclassified Scores
              </button>
            </div>
          </div>

          {/* Audit Data Breakdown Strip */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                PRODUCTION
              </span>
              <div className="grid grid-cols-4 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <div>Evaluations: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{auditData.realData.evaluations || realScoresCount}</strong></div>
                <div>Recognitions: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{auditData.realData.recognitions}</strong></div>
                <div>Adjustments: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{auditData.realData.adjustments}</strong></div>
                <div>Turns: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{auditData.realData.liveFloorTurns || 0}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  TEST {testMode.testRunId ? `(${testMode.testRunId})` : ''}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <div>Evals: <strong className="font-mono text-rose-500">{auditData.testData.evaluations}</strong></div>
                <div>Recogs: <strong className="font-mono text-amber-500">{auditData.testData.recognitions}</strong></div>
                <div>Adjs: <strong className="font-mono text-slate-600 dark:text-slate-400">{auditData.testData.adjustments}</strong></div>
                <div>Turns: <strong className="font-mono text-slate-600 dark:text-slate-400">{auditData.testData.testFloorTurns || 0}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-blue-500/5 border-blue-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                SPEAKING PROCEEDINGS
              </span>
              <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium">
                <div>Live Speaking Turns: <strong className="font-mono text-blue-600 dark:text-blue-400">{auditData.realData.liveFloorTurns || 0}</strong></div>
                <div>Test Turns: <strong className="font-mono text-slate-500">{auditData.testData.testFloorTurns || 0}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Evaluations</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-amber-500">{stats.totalRecords}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Official jury score records</p>
        </div>

        <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scored Delegates</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-blue-500">{stats.uniqueLearners} <span className="text-xs text-slate-400 font-normal">/ {learners.length}</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Assigned MLAs</p>
        </div>

        <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Juries</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-emerald-500">{stats.uniqueJuries}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Independent evaluators</p>
        </div>

        <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scored Sessions</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-purple-500">{stats.uniqueSessions}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Discrete assembly proceedings</p>
        </div>

        <div className="p-4 rounded-2xl border shadow-xs col-span-2 sm:col-span-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Adjustments</span>
            <History className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-rose-500">{stats.totalAdjustments}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Audited turn revisions</p>
        </div>
      </div>

      {/* Comprehensive Filter Controls & View Selector */}
      <div
        className="rounded-2xl p-4 md:p-5 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Views & Filters
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {viewMode === 'leaderboard_session' && `${displayedSessionLeaderboardRows.length} participants`}
              {viewMode === 'leaderboard_overall' && `${displayedOverallLeaderboardRows.length} participants`}
              {viewMode === 'recognition' && `${mostRecognizedParticipants.length} recognized participants`}
              {viewMode === 'matrix' && `${filteredScoreRecords.length} evaluations`}
              {viewMode === 'itemized' && `${filteredItemizedRows.length} rows`}
              {viewMode === 'adjustments' && `${allAdjustmentsLog.length} adjustments`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Top 40 limit toggle (Visible in Leaderboard views) */}
            {(viewMode === 'leaderboard_session' || viewMode === 'leaderboard_overall') && (
              <div className="flex items-center gap-1 p-0.5 rounded-xl border bg-slate-100 dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsTop40Only(true)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${
                    isTop40Only ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Limit view to top 40 participants"
                >
                  TOP 40
                </button>
                <button
                  type="button"
                  onClick={() => setIsTop40Only(false)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${
                    !isTop40Only ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Display all eligible participants"
                >
                  ALL ({viewMode === 'leaderboard_session' ? sessionLeaderboardRows.length : overallLeaderboardRows.length})
                </button>
              </div>
            )}

            {/* View Mode Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl border bg-slate-100 dark:bg-slate-800/80 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setViewMode('leaderboard_session')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'leaderboard_session' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" /> Session Leaderboard
              </button>
              <button
                type="button"
                onClick={() => setViewMode('leaderboard_overall')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'leaderboard_overall' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Overall Leaderboard
              </button>
              <button
                type="button"
                onClick={() => setViewMode('recognition')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'recognition' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Jury Recognition
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'matrix' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Delegate Matrix
              </button>
              <button
                type="button"
                onClick={() => setViewMode('itemized')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'itemized' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Itemized Log
              </button>
              <button
                type="button"
                onClick={() => setViewMode('adjustments')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'adjustments' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" /> Adjustment Trail ({allAdjustmentsLog.length})
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* 1. Participant Active Status Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Participant Status
            </label>
            <select
              value={selectedParticipantStatus}
              onChange={e => setSelectedParticipantStatus(e.target.value as any)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="ALL">All Participants</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* 2. Session Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Session
            </label>
            <select
              value={selectedSessionFilter}
              onChange={e => setSelectedSessionFilter(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ borderColor: 'var(--border)' }}
            >
              {viewMode !== 'leaderboard_session' && <option value="ALL">All Sessions</option>}
              {availableSessions.map(sess => (
                <option key={sess.id} value={sess.id}>
                  {sess.name} {sess.day ? `(${sess.day})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Jury Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Jury / Evaluator
            </label>
            <select
              value={selectedJuryFilter}
              onChange={e => setSelectedJuryFilter(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="ALL">All Juries</option>
              {availableJuries.map(j => (
                <option key={j.id} value={j.id}>
                  {j.name} ({j.designation || 'Juror'})
                </option>
              ))}
              {Array.from(new Set(eventScores.map(s => s.juror_name || s.jury_id)))
                .filter(name => name && !availableJuries.some(j => j.name === name || j.id === name))
                .map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
            </select>
          </div>

          {/* 4. Party / Bench Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Bench / Side
            </label>
            <select
              value={selectedBenchFilter}
              onChange={e => setSelectedBenchFilter(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="ALL">All Benches</option>
              <option value="Ruling">Ruling Bench</option>
              <option value="Opposition">Opposition Bench</option>
              <option value="Independent">Independent</option>
            </select>
          </div>

          {/* 5. Completion Filter (or Category for Matrix / Turn for Recognition) */}
          {viewMode === 'recognition' ? (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
                Speaking Turn
              </label>
              <select
                value={recogFilterTurn}
                onChange={e => setRecogFilterTurn(e.target.value)}
                className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="ALL">All Turns</option>
                {Array.from(new Set(speechImpactSummaries.map(s => `#${s.sequenceNumber}`))).sort().map(turnNum => (
                  <option key={turnNum} value={turnNum}>Turn {turnNum}</option>
                ))}
              </select>
            </div>
          ) : viewMode === 'matrix' || viewMode === 'itemized' ? (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
                Rubric Category
              </label>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value as CategoryId)}
                className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                style={{ borderColor: 'var(--border)' }}
              >
                {SCORING_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.max < 100 ? `(Max ${cat.max})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
                Jury Completion
              </label>
              <select
                value={selectedCompletionFilter}
                onChange={e => setSelectedCompletionFilter(e.target.value as any)}
                className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="ALL">All Completion States</option>
                <option value="FULLY_SCORED">Fully Scored (All Jurors)</option>
                <option value="PARTIALLY_SCORED">Partially Scored</option>
              </select>
            </div>
          )}

          {/* 6. Adjustment Status Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Adjustment Filter
            </label>
            <select
              value={selectedAdjustmentFilter}
              onChange={e => setSelectedAdjustmentFilter(e.target.value as any)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="ALL">All Scores</option>
              <option value="ADJUSTED">Adjusted Records Only</option>
              <option value="NOT_ADJUSTED">Turn 1 Original Only</option>
            </select>
          </div>

          {/* 7. Sorting Order */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Sort Order
            </label>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as any)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border focus:outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="score_desc">Score ↓ (Highest First)</option>
              <option value="score_asc">Score ↑ (Lowest First)</option>
              <option value="updated_desc">Latest Saved First</option>
              <option value="name_asc">Student Name (A → Z)</option>
            </select>
          </div>

        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by delegate name, seat number (#42), constituency, bench, jury, or remarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            style={{ borderColor: 'var(--border)' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* VIEW: SESSION LEADERBOARD (PHASE 9 & 10) */}
      {viewMode === 'leaderboard_session' && (
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Session Leaderboard: {availableSessions.find(s => s.id === activeSessionId)?.name || activeSessionId}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {displayedSessionLeaderboardRows.length} {isTop40Only ? 'in Top 40' : 'Total Ranked'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Deterministic tie-break: Score ↓ • Conduct Avg ↓ • Research Avg ↓ • Completion Ratio ↓ • Learner ID
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="p-3.5 pl-4 text-center w-12">Rank</th>
                  <th className="p-3.5">Participant / MLA</th>
                  <th className="p-3.5">Constituency</th>
                  <th className="p-3.5">Bench</th>
                  <th className="p-3.5 text-right font-black">Session Score</th>
                  <th className="p-3.5 text-center">Jury Completion</th>
                  <th className="p-3.5 text-center">Speaking Turns</th>
                  <th className="p-3.5 text-center">Conduct (12)</th>
                  <th className="p-3.5 text-center">Research (30)</th>
                  <th className="p-3.5 text-center">Delivery (20)</th>
                  <th className="p-3.5 text-center">Adjustments</th>
                  <th className="p-3.5 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {displayedSessionLeaderboardRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-xs text-slate-400">
                      No evaluations recorded for {availableSessions.find(s => s.id === activeSessionId)?.name || 'this session'} matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedSessionLeaderboardRows.map(row => {
                    const learner = learnerMap.get(row.learnerId);
                    return (
                      <tr key={row.learnerId} className="hover:bg-slate-500/5 transition-colors">
                        <td className="p-3.5 pl-4 text-center font-black">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            row.rank === 1 ? 'bg-amber-500 text-white shadow-xs' :
                            row.rank === 2 ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white' :
                            row.rank === 3 ? 'bg-amber-700 text-white' : 'text-slate-400 font-mono'
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                          <div className="flex items-center gap-1.5">
                            <span>{row.studentName}</span>
                            {learner?.access_code && (
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {learner.access_code}
                              </span>
                            )}
                            {learner && !isParticipantActive(learner) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-blue-500">
                            #{row.constituencyNumber ?? '?'}
                          </span>{' '}
                          <span className="text-[11px] text-slate-400 truncate">
                            {row.constituencyName || ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            row.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            row.bench === 'Opposition' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                          }`}>
                            {row.bench}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black font-mono text-base text-amber-500">
                          {row.sessionScore.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.completionStatus === 'FULLY_SCORED' ?
                            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}>
                            {row.completionStatus === 'FULLY_SCORED' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                            <span>{row.jurorCount} / {row.expectedJurors} Jurors</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px]">
                            {row.speakingTurnCount} {row.speakingTurnCount === 1 ? 'Turn' : 'Turns'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                          {row.avgConduct.toFixed(1)}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                          {row.avgResearch.toFixed(1)}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                          {row.avgComm.toFixed(1)}
                        </td>
                        <td className="p-3.5 text-center">
                          {row.adjustmentsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              {row.adjustmentsCount} Adjusted
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Original</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <button
                            type="button"
                            onClick={() => handleOpenTrailModal(row.learnerId, activeSessionId)}
                            className="px-2.5 py-1 rounded-lg border text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/20 cursor-pointer inline-flex items-center gap-1 transition"
                            title="Inspect complete turn and adjustment audit trail"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Trail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: OVERALL LEADERBOARD (PHASE 11) */}
      {viewMode === 'leaderboard_overall' && (
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Overall Assembly Leaderboard
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {displayedOverallLeaderboardRows.length} {isTop40Only ? 'in Top 40' : 'Total Ranked'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Overall Score = Arithmetic mean across scored sessions ONLY (unscored sessions are never penalized as zeroes)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="p-3.5 pl-4 text-center w-12">Rank</th>
                  <th className="p-3.5">Participant / MLA</th>
                  <th className="p-3.5">Constituency</th>
                  <th className="p-3.5">Bench</th>
                  <th className="p-3.5 text-right font-black">Overall Score</th>
                  <th className="p-3.5 text-center">Sessions Evaluated</th>
                  <th className="p-3.5 text-center">Jury Evaluations</th>
                  <th className="p-3.5 text-center">Speaking Turns</th>
                  <th className="p-3.5">Session Scores Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {displayedOverallLeaderboardRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                      No evaluations recorded yet for this event.
                    </td>
                  </tr>
                ) : (
                  displayedOverallLeaderboardRows.map(row => {
                    const learner = learnerMap.get(row.learnerId);
                    return (
                      <tr key={row.learnerId} className="hover:bg-slate-500/5 transition-colors">
                        <td className="p-3.5 pl-4 text-center font-black">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            row.rank === 1 ? 'bg-amber-500 text-white shadow-xs' :
                            row.rank === 2 ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white' :
                            row.rank === 3 ? 'bg-amber-700 text-white' : 'text-slate-400 font-mono'
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                          <div className="flex items-center gap-1.5">
                            <span>{row.studentName}</span>
                            {learner?.access_code && (
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {learner.access_code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-blue-500">
                            #{row.constituencyNumber ?? '?'}
                          </span>{' '}
                          <span className="text-[11px] text-slate-400 truncate">
                            {row.constituencyName || ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            row.bench === 'Ruling' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            row.bench === 'Opposition' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                          }`}>
                            {row.bench}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black font-mono text-base text-amber-500">
                          {row.overallScore.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-bold font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px]">
                            {row.sessionsEvaluatedCount} {row.sessionsEvaluatedCount === 1 ? 'Session' : 'Sessions'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-400">
                          {row.totalJurorEvaluationsCount}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px]">
                            {row.speakingTurnCount} Turns
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Object.values(row.sessionBreakdown).map(sb => (
                              <span
                                key={sb.sessionId}
                                className="px-2 py-0.5 rounded text-[10px] font-mono border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                title={`${sb.sessionName}: ${sb.score.toFixed(1)}/100 (${sb.jurorCount} jurors, ${sb.speakingTurnCount} turns)`}
                              >
                                <span className="font-semibold text-slate-500">{sb.sessionName.slice(0, 10)}:</span>{' '}
                                <span className="font-black text-amber-500">{sb.score.toFixed(1)}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: JURY RECOGNITION & SPEECH IMPACT */}
      {viewMode === 'recognition' && (
        <div className="space-y-6">
          {/* Informational Guidance Banner */}
          <div className="rounded-2xl p-4 border bg-amber-500/5 border-amber-500/20 flex items-start gap-3 shadow-xs">
            <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Jury Recognition & Speech Impact (Informational Signal)
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Jury Recognition is a qualitative per-turn signal indicating speeches that caught jurors' attention.
                It is completely independent and <strong>never modifies the 100-point rubric evaluation, session leaderboard, overall leaderboard, or Top 40 rankings</strong>.
              </p>
            </div>
          </div>

          {/* Section 1: MOST RECOGNIZED PARTICIPANTS */}
          <div
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Most Recognized Participants
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {mostRecognizedParticipants.length} Participants
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Aggregated by participant • Includes speaking turn frequency context
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b text-[10px] uppercase font-bold tracking-wider"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
                >
                  <tr>
                    <th className="p-3.5 pl-4 text-center w-12">#</th>
                    <th className="p-3.5">Participant / MLA</th>
                    <th className="p-3.5">Constituency</th>
                    <th className="p-3.5">Bench</th>
                    <th className="p-3.5 text-center font-black text-amber-600 dark:text-amber-400">Jury Recognitions</th>
                    <th className="p-3.5 text-center">Speaking Turns</th>
                    <th className="p-3.5 text-center">Jury Coverage</th>
                    <th className="p-3.5 text-right pr-4">Recognition Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {mostRecognizedParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No jury recognitions recorded yet for this event matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    mostRecognizedParticipants.map((p, idx) => {
                      const learner = learnerMap.get(p.learnerId);
                      return (
                        <tr key={p.learnerId} className="hover:bg-slate-500/5 transition-colors">
                          <td className="p-3.5 pl-4 text-center font-bold font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex items-center gap-1.5">
                              <span>{p.studentName}</span>
                              {learner?.access_code && (
                                <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                  {learner.access_code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-blue-500">
                              #{p.constituencyNumber ?? '?'}
                            </span>{' '}
                            <span className="text-[11px] text-slate-400 truncate">
                              {p.constituencyName || ''}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{
                                background: p.bench === 'Ruling' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                                color: p.bench === 'Ruling' ? 'var(--emerald)' : '#ef4444',
                                borderColor: p.bench === 'Ruling' ? 'var(--emerald)' : '#ef4444'
                              }}
                            >
                              {p.bench || 'Ruling'} Bench
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-black text-sm text-amber-500">
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {p.recognitionCount}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {p.speakingTurnCount}
                          </td>
                          <td className="p-3.5 text-center font-mono text-[11px]">
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              {p.distinctJurorCount} / {p.totalJurors} Jurors
                            </div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              {p.recognitionCoverage ?? Math.round((p.distinctJurorCount / (p.totalJurors || 1)) * 100)}% coverage
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold pr-4 text-slate-700 dark:text-slate-300">
                            {p.speakingTurnCount > 0 ? (
                              <>
                                {p.recognitionRate} <span className="text-[10px] text-slate-400 font-normal">/ turn</span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-normal italic">
                                N/A — No recorded speaking turns
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: SPEECH IMPACT (By Individual Speaking Turn) */}
          <div
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Speech Impact (By Individual Speaking Turn)
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {speechImpactSummaries.length} Speeches
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Answers: "Which individual speeches attracted the most jury recognition?"
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b text-[10px] uppercase font-bold tracking-wider"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
                >
                  <tr>
                    <th className="p-3.5 pl-4">Speaker</th>
                    <th className="p-3.5">Session</th>
                    <th className="p-3.5 text-center">Turn</th>
                    <th className="p-3.5 text-center font-black text-amber-600 dark:text-amber-400">Recognitions</th>
                    <th className="p-3.5 text-center">Jury Coverage</th>
                    <th className="p-3.5 text-center">Speaking Duration</th>
                    <th className="p-3.5 pr-4">Juror Signals & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {speechImpactSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        No speeches matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    speechImpactSummaries.map(s => {
                      return (
                        <tr key={s.speakingTurnId} className="hover:bg-slate-500/5 transition-colors">
                          <td className="p-3.5 pl-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex items-center gap-1.5">
                              <span>{s.studentName}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                (#{s.constituencyNumber ?? '?'})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {s.constituencyName || ''} • {s.partyName}
                            </div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                            {s.sessionName}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              #{s.sequenceNumber}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-black text-sm text-amber-500">
                            <span className="inline-flex items-center gap-1">
                              <Star className={`w-3.5 h-3.5 ${s.recognitionCount > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                              {s.recognitionCount}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono text-[11px]">
                            <div className="text-slate-700 dark:text-slate-300 font-bold">
                              {s.distinctJurorCount} / {s.totalJurors} Jurors
                            </div>
                            {s.recognitionCoverage !== undefined && (
                              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                {s.recognitionCoverage}%
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {s.speakingDuration ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <Clock className="w-2.5 h-2.5" />
                                {s.speakingDuration}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3.5 pr-4">
                            {s.jurorRecognitions.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {s.jurorRecognitions.map((r, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px]"
                                    title={r.note ? `Note: "${r.note}"` : undefined}
                                  >
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    <span className="font-bold">{r.juryName || 'Juror'}</span>
                                    {r.note && <span className="italic text-slate-500">"{r.note}"</span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ADJUSTMENTS AUDIT TRAIL TAB (PHASE 13) */}
      {viewMode === 'adjustments' && (
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Immutable Score Adjustment Audit Trail ({allAdjustmentsLog.length})
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Mandatory reasons, juror identities, previous vs new scores, and timestamps
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="p-3.5 pl-4">Delegate</th>
                  <th className="p-3.5">Session</th>
                  <th className="p-3.5">Juror</th>
                  <th className="p-3.5 text-center font-bold">Previous</th>
                  <th className="p-3.5 text-center font-bold">New Score</th>
                  <th className="p-3.5 text-center font-black">Delta</th>
                  <th className="p-3.5">Mandatory Adjustment Reason</th>
                  <th className="p-3.5 text-right font-mono pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {allAdjustmentsLog.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No score adjustments have been recorded yet. All evaluations reflect Turn 1 initial evaluations.
                    </td>
                  </tr>
                ) : (
                  allAdjustmentsLog.map(adj => (
                    <tr key={adj.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="p-3.5 pl-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                        <div>
                          <span>{adj.learner_name}</span>
                          {adj.constituency_number && (
                            <span className="text-slate-400 text-[10px] block font-normal">
                              #{adj.constituency_number} {adj.constituency_name || ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {adj.session_name}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {adj.juror_name || 'Juror'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                        {adj.previous_total}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-amber-500">
                        {adj.new_total}
                      </td>
                      <td className="p-3.5 text-center font-mono font-black">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          adj.delta_total > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          adj.delta_total < 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {adj.delta_total > 0 ? `+${adj.delta_total}` : adj.delta_total}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs italic max-w-md" style={{ color: 'var(--text-primary)' }}>
                        "{adj.adjustment_reason}"
                      </td>
                      <td className="p-3.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap pr-4">
                        {new Date(adj.adjusted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(adj.adjusted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Delegate Matrix Table (Primary Admin Result View) */}
      {viewMode === 'matrix' && (
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Delegate Score Matrix ({filteredScoreRecords.length} Evaluations)
              </h4>
              {selectedCategoryFilter !== 'ALL' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Focus: {SCORING_CATEGORIES.find(c => c.id === selectedCategoryFilter)?.name || selectedCategoryFilter}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              All 6 rubric breakdown columns per session & juror
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="p-3.5 pl-4">Delegate</th>
                  <th className="p-3.5">Constituency</th>
                  <th className="p-3.5">Session</th>
                  <th className="p-3.5">Juror</th>
                  <th className={`p-3.5 text-center transition-colors ${selectedCategoryFilter === 'research_constituency' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black' : ''}`}>Research (30)</th>
                  <th className={`p-3.5 text-center transition-colors ${selectedCategoryFilter === 'relevance_agenda' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black' : ''}`}>Agenda (20)</th>
                  <th className={`p-3.5 text-center transition-colors ${selectedCategoryFilter === 'communication_delivery' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black' : ''}`}>Delivery (20)</th>
                  <th className={`p-3.5 text-center transition-colors ${selectedCategoryFilter === 'parliamentary_conduct' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black' : ''}`}>Conduct (12)</th>
                  <th className={`p-3.5 text-center transition-colors ${selectedCategoryFilter === 'originality_preparation' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black' : ''}`}>Orig. (12)</th>
                  <th className={`p-3.5 text-center transition-colors ${selectedCategoryFilter === 'time_management' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black' : ''}`}>Time (6)</th>
                  <th className={`p-3.5 text-right font-black transition-colors ${selectedCategoryFilter === 'total' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : ''}`}>Total (/100)</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {filteredScoreRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-xs text-slate-400">
                      No score records match your active status, session, jury, or search filters.
                    </td>
                  </tr>
                ) : (
                  filteredScoreRecords.map(sc => {
                    const learner = learnerMap.get(sc.learner_id);
                    return (
                      <tr key={sc.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="p-3.5 pl-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                          <div className="flex items-center gap-1.5">
                            <span>{sc.learner_name || learner?.full_name}</span>
                            {learner?.access_code && (
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {learner.access_code}
                              </span>
                            )}
                            {learner && !isParticipantActive(learner) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-blue-500">
                            #{sc.constituency_number ?? learner?.constituency_number ?? '?'}
                          </span>{' '}
                          <span className="text-[11px] text-slate-400 truncate">
                            {sc.constituency_name || learner?.constituency_name || ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {sc.session_name || 'Session'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {sc.juror_name || 'Juror'}
                          </span>
                        </td>
                        <td className={`p-3.5 text-center font-mono ${selectedCategoryFilter === 'research_constituency' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}`}>{sc.research_constituency ?? sc.policy_knowledge ?? 0}</td>
                        <td className={`p-3.5 text-center font-mono ${selectedCategoryFilter === 'relevance_agenda' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}`}>{sc.relevance_agenda ?? sc.rebuttal_debate ?? 0}</td>
                        <td className={`p-3.5 text-center font-mono ${selectedCategoryFilter === 'communication_delivery' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}`}>{sc.communication_delivery ?? sc.oratory ?? 0}</td>
                        <td className={`p-3.5 text-center font-mono ${selectedCategoryFilter === 'parliamentary_conduct' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}`}>{sc.parliamentary_conduct ?? 0}</td>
                        <td className={`p-3.5 text-center font-mono ${selectedCategoryFilter === 'originality_preparation' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}`}>{sc.originality_preparation ?? 0}</td>
                        <td className={`p-3.5 text-center font-mono ${selectedCategoryFilter === 'time_management' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-500/5' : ''}`}>{sc.time_management ?? 0}</td>
                        <td className={`p-3.5 text-right font-black font-mono text-amber-500 text-sm ${selectedCategoryFilter === 'total' ? 'bg-amber-500/5' : ''}`}>
                          {sc.total}
                        </td>
                        <td className="p-3.5 text-slate-400 italic text-[11px] max-w-xs truncate">
                          {sc.feedback || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Itemized Score Log Table (Detailed Audit View) */}
      {viewMode === 'itemized' && (
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Itemized Score Records ({filteredItemizedRows.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Filtered View • {selectedCategoryFilter === 'ALL' ? 'All Rubric Categories' : selectedCategoryFilter}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="p-3.5 pl-4">#</th>
                  <th className="p-3.5">Student / Delegate</th>
                  <th className="p-3.5">Constituency</th>
                  <th className="p-3.5">Party & Bench</th>
                  <th className="p-3.5">Jury</th>
                  <th className="p-3.5">Session</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right font-black">Score</th>
                  <th className="p-3.5 text-right font-bold">Saved At</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {filteredItemizedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                      No score records match your selected session, jury, category, or search filters.
                    </td>
                  </tr>
                ) : (
                  filteredItemizedRows.map((row, idx) => (
                    <tr key={row.key} className="hover:bg-slate-500/5 transition-colors">
                      <td className="p-3.5 pl-4 font-mono text-[11px] text-slate-400">#{idx + 1}</td>
                      <td className="p-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                        <div className="flex items-center gap-1.5">
                          <span>{row.studentName}</span>
                          {row.accessCode && (
                            <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              {row.accessCode}
                            </span>
                          )}
                          {!row.isParticipantActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                          {row.constituencyNumber !== undefined ? `#${row.constituencyNumber} ` : ''}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {row.constituencyName || 'MLA'}
                        </span>
                      </td>
                      <td className="p-3.5" style={{ color: 'var(--text-secondary)' }}>
                        {row.partyName} •{' '}
                        <span className={row.bench === 'Ruling' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                          {row.bench}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {row.juryName}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {row.sessionName}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {row.categoryName}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black font-mono">
                        <span className="text-sm text-amber-500">{row.score}</span>
                        <span className="text-[10px] text-slate-400 font-normal"> / {row.maxScore}</span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(row.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(row.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ADJUSTMENT TRAIL DRILL-DOWN (PHASE 8 & 13) */}
      {isTrailModalOpen && selectedTrailEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="rounded-2xl max-w-xl w-full p-6 border shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                    Speaking Turn & Evaluation Trail
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Chronological audit of speaking floor entries and score adjustments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Delegate & Session Header Card */}
            <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delegate</span>
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  {selectedTrailEvaluation.learner_name}
                </p>
                <p className="text-xs text-slate-400">
                  #{selectedTrailEvaluation.constituency_number ?? '?'} {selectedTrailEvaluation.constituency_name || ''} • {selectedTrailEvaluation.party_name} ({selectedTrailEvaluation.bench})
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Score</span>
                <p className="text-xl font-black text-amber-500 font-mono">
                  {selectedTrailEvaluation.total} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {selectedTrailEvaluation.jury_name}
                </span>
              </div>
            </div>

            {/* Chronological Steps */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Audit Timeline
              </h5>

              {/* Turn 1: Initial Evaluation */}
              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/40 space-y-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Sparkles className="w-3 h-3" /> Turn 1 — Initial Evaluation
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(selectedTrailEvaluation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1 font-mono text-xs">
                  <div className="p-1.5 rounded-lg border bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] block text-slate-400 font-sans">Research</span>
                    <span className="font-black text-blue-500">{selectedTrailEvaluation.research_constituency}</span>/30
                  </div>
                  <div className="p-1.5 rounded-lg border bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] block text-slate-400 font-sans">Agenda</span>
                    <span className="font-black text-purple-500">{selectedTrailEvaluation.relevance_agenda}</span>/20
                  </div>
                  <div className="p-1.5 rounded-lg border bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] block text-slate-400 font-sans">Delivery</span>
                    <span className="font-black text-emerald-500">{selectedTrailEvaluation.communication_delivery}</span>/20
                  </div>
                  <div className="p-1.5 rounded-lg border bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] block text-slate-400 font-sans">Conduct</span>
                    <span className="font-black text-amber-500">{selectedTrailEvaluation.parliamentary_conduct}</span>/12
                  </div>
                  <div className="p-1.5 rounded-lg border bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] block text-slate-400 font-sans">Originality</span>
                    <span className="font-black text-rose-500">{selectedTrailEvaluation.originality_preparation}</span>/12
                  </div>
                  <div className="p-1.5 rounded-lg border bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] block text-slate-400 font-sans">Time</span>
                    <span className="font-black text-cyan-500">{selectedTrailEvaluation.time_management}</span>/6
                  </div>
                </div>

                {selectedTrailEvaluation.feedback && (
                  <p className="text-[11px] italic text-slate-400 pt-1">
                    "{selectedTrailEvaluation.feedback}"
                  </p>
                )}
              </div>

              {/* Adjustments Trail */}
              {(selectedTrailEvaluation.adjustments || []).map((adj, idx) => (
                <div
                  key={adj.id}
                  className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/40 space-y-2 border-l-4 border-l-rose-500"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <History className="w-3 h-3" /> Turn {idx + 2} — Score Adjustment
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(adj.adjusted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs text-slate-400">Score Revision:</span>
                    <div className="flex items-center gap-2 font-mono font-bold text-xs">
                      <span className="text-slate-400">{adj.previous_total}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="text-amber-500">{adj.new_total}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        adj.delta_total > 0 ? 'bg-emerald-500/10 text-emerald-500' :
                        adj.delta_total < 0 ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'
                      }`}>
                        ({adj.delta_total > 0 ? `+${adj.delta_total}` : adj.delta_total})
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mandatory Reason</span>
                    <p className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 italic text-slate-700 dark:text-slate-300">
                      "{adj.adjustment_reason}"
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Adjusted by: {adj.juror_name || 'Juror'}</span>
                    <span>{new Date(adj.adjusted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                type="button"
                onClick={() => setIsTrailModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Test Scores Confirmation Modal */}
      {isResetTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  RESET TEST SCORES?
                </h4>
                <p className="text-xs text-rose-500/90 font-medium">
                  Safely remove ONLY records marked is_test === true.
                </p>
              </div>
            </div>

            {/* Scope Selection */}
            {testMode.testRunId && (
              <div className="space-y-1.5 p-3 rounded-xl border bg-slate-100/50 dark:bg-slate-900/40 text-xs" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] uppercase font-bold text-slate-400">Purge Scope</span>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="resetScope"
                      checked={resetScope === 'all'}
                      onChange={() => setResetScope('all')}
                      className="cursor-pointer"
                    />
                    <span>Purge ALL Test Data for this event</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="resetScope"
                      checked={resetScope === 'current_run'}
                      onChange={() => setResetScope('current_run')}
                      className="cursor-pointer"
                    />
                    <span>Purge ONLY Current Test Run ({testMode.testRunId})</span>
                  </label>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 space-y-2.5" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Event:</span>
                <p className="text-sm font-black truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {eventName || 'Current Event'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Test Evaluations:</span>
                  <span className="font-mono font-black text-rose-500 text-sm">
                    {auditData.testData.evaluations}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Test Recognitions:</span>
                  <span className="font-mono font-black text-amber-500 text-sm">
                    {auditData.testData.recognitions}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Test Speaking Turns:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {auditData.testData.testFloorTurns || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Test Adjustments:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {auditData.testData.adjustments}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-xs space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Will NOT delete:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  <span>✓ Participants</span>
                  <span>✓ Attendance</span>
                  <span>✓ Questions</span>
                  <span>✓ Votes</span>
                  <span>✓ Bills</span>
                  <span>✓ Agenda</span>
                  <span>✓ Production evaluations</span>
                  <span>✓ Production recognitions</span>
                  <span>✓ Production speaking turns</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <span className="text-slate-400">Real Production Scores Preserved:</span>
                <span className="font-mono font-black text-emerald-500 text-sm px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  {auditData.realData.evaluations || realScoresCount}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 select-all font-black">RESET TEST RUN</span> below:
              </label>
              <input
                type="text"
                value={typedTestConfirm}
                onChange={e => setTypedTestConfirm(e.target.value)}
                placeholder="Type RESET TEST RUN"
                className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-rose-300 dark:border-rose-900 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetTestModalOpen(false);
                  setTypedTestConfirm('');
                }}
                className="px-4 py-2.5 rounded-xl border font-semibold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                disabled={isDeletingTestScores}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTestScores}
                disabled={isDeletingTestScores || typedTestConfirm !== 'RESET TEST RUN'}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingTestScores ? 'Resetting...' : 'Confirm Reset Test Run'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset LIVE Speaking Turns Confirmation Modal */}
      {isResetLiveSpeakingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black tracking-tight text-rose-600 dark:text-rose-400">
                  RESET ALL LIVE SPEAKING TURNS?
                </h4>
                <p className="text-xs text-rose-500/90 font-medium">
                  Reset all LIVE speaking turns for this event?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 space-y-2.5" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Event:</span>
                <p className="text-sm font-black truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {eventName || 'Current Event'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Live Turns:</span>
                  <span className="font-mono font-black text-rose-500 text-sm">
                    {auditData.realData.liveFloorTurns}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Test Turns:</span>
                  <span className="font-mono font-black text-emerald-500 text-sm">
                    {auditData.testData.testFloorTurns}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border bg-rose-500/5 border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                ⚠️ <strong>WARNING:</strong> This will remove all {auditData.realData.liveFloorTurns} LIVE speaking turns and reset the active speaker. This action cannot be undone.
              </div>

              <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-xs space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Will NOT modify:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  <span>✓ Learners / MLA Roster</span>
                  <span>✓ Attendance</span>
                  <span>✓ Questions</span>
                  <span>✓ Flash Votes & Bills</span>
                  <span>✓ Agenda Items</span>
                  <span>✓ Committees & Parties</span>
                  <span>✓ Jury Members & Volunteers</span>
                  <span>✓ Production Jury Evaluations</span>
                  <span>✓ Production Recognitions</span>
                  <span>✓ Test Speaking Turns ({auditData.testData.testFloorTurns})</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 select-all font-black">RESET LIVE TURNS</span> below:
              </label>
              <input
                type="text"
                value={typedLiveSpeakingConfirm}
                onChange={e => setTypedLiveSpeakingConfirm(e.target.value)}
                placeholder="Type RESET LIVE TURNS"
                className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-rose-300 dark:border-rose-900 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetLiveSpeakingModalOpen(false);
                  setTypedLiveSpeakingConfirm('');
                }}
                className="px-4 py-2.5 rounded-xl border font-semibold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                disabled={isResettingLiveSpeakingTurns}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetLiveSpeakingTurns}
                disabled={isResettingLiveSpeakingTurns || typedLiveSpeakingConfirm !== 'RESET LIVE TURNS'}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResettingLiveSpeakingTurns ? 'Resetting...' : 'Confirm Reset Live Speaking Turns'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Jury Scoring Modal (Admin Only, Complete Reset with strict safeguards) */}
      {isResetJuryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                  RESET JURY SCORING
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {eventName || 'Current Event'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-rose-500/5 border-rose-500/20 space-y-3">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                This will remove all jury scoring activity for <strong>THIS EVENT ONLY</strong>:
              </p>
              <ul className="text-xs space-y-1 font-medium text-rose-600 dark:text-rose-400">
                <li>• Official jury evaluations</li>
                <li>• Speaking-turn score links</li>
                <li>• Score adjustments & audit trail</li>
                <li>• Jury recognition marks</li>
                <li>• Jury scoring history for this event</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-xs space-y-1.5">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">It will NOT remove:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <span>✓ Participants</span>
                <span>✓ Attendance</span>
                <span>✓ Questions</span>
                <span>✓ Agenda</span>
                <span>✓ Parties</span>
                <span>✓ Committees</span>
                <span>✓ Constituencies</span>
                <span>✓ Votes</span>
                <span>✓ Bills</span>
                <span>✓ Event configuration</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-slate-100/60 dark:bg-slate-900/60 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Jury Records:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <div>Evaluations / Scores: <strong className="text-amber-500">{eventScores.length}</strong></div>
                <div>Adjustments: <strong className="text-slate-500">{allAdjustmentsLog.length}</strong></div>
                <div>Recognitions: <strong className="text-slate-500">{auditData.testData.recognitions + (auditData.realData.recognitions || 0)}</strong></div>
                <div>Speaking Turns: <strong className="text-emerald-500">Preserved</strong></div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 select-all font-black">RESET JURY SCORES</span> below:
              </label>
              <input
                type="text"
                value={typedJuryConfirm}
                onChange={e => setTypedJuryConfirm(e.target.value)}
                placeholder="Type RESET JURY SCORES"
                className="w-full px-3 py-2 rounded-xl border font-mono text-xs focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-rose-300 dark:border-rose-900 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsResetJuryModalOpen(false);
                  setTypedJuryConfirm('');
                }}
                className="px-4 py-2 rounded-xl border font-semibold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                disabled={isResettingJuryScoring}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetJuryScoring}
                disabled={typedJuryConfirm !== 'RESET JURY SCORES' || isResettingJuryScoring}
                className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResettingJuryScoring ? 'Resetting...' : 'BACK UP + RESET JURY SCORING'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Review Unclassified Scores Modal */}
      {isUnclassifiedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="rounded-2xl max-w-3xl w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3 shrink-0" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h4 className="text-base font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                  Review & Classify Test-Like Scores
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select manual test scores to tag them as test data. Once classified, they can be safely purged without touching genuine production scores.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUnclassifiedModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Pills & Selection Controls */}
            <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCandidateFilter('candidates_only')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    candidateFilter === 'candidates_only'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Suspected Test Scores ({suspectedCandidatesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateFilter('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    candidateFilter === 'all'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Unclassified Scores ({unclassifiedCandidates.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllDisplayedCandidates}
                  className="text-xs font-bold text-blue-500 hover:underline cursor-pointer"
                >
                  Select All Displayed
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds(new Set())}
                  className="text-xs font-bold text-slate-400 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Table of Candidates */}
            <div className="overflow-y-auto flex-1 border rounded-xl" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b" style={{ borderColor: 'var(--border)' }}>
                  <tr>
                    <th className="p-3 pl-4 w-10 text-center">Select</th>
                    <th className="p-3">Participant</th>
                    <th className="p-3">Session</th>
                    <th className="p-3">Jury</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {displayedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No candidates found matching filter.
                      </td>
                    </tr>
                  ) : (
                    displayedCandidates.map(c => {
                      const isSelected = selectedCandidateIds.has(c.id);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => handleToggleCandidateSelect(c.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-500/5'
                          }`}
                        >
                          <td className="p-3 pl-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCandidateSelect(c.id)}
                              className="rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                            {c.learner_name}
                          </td>
                          <td className="p-3 text-slate-500">{c.session_name}</td>
                          <td className="p-3 text-slate-500">{c.jury_name}</td>
                          <td className="p-3 text-center font-mono font-bold text-amber-500">{c.total}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3">
                            {c.isLikelyTest ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {c.suspectReason || 'Test Candidate'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Standard</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t shrink-0" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="text-xs text-slate-500">
                Selected: <strong className="text-slate-900 dark:text-white">{selectedCandidateIds.size}</strong> records
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnclassifiedModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClassifySelected}
                  disabled={selectedCandidateIds.size === 0 || isClassifying}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isClassifying ? 'Classifying...' : `Mark ${selectedCandidateIds.size} Selected as Test`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Delegate Modal */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div>
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Record Score for Session
                </h4>
                <p className="text-[11px] text-slate-400">
                  Scores will be anchored to the selected session without overwriting other sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGradeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGradeModalSubmit} className="space-y-3.5 text-xs">
              
              {/* Session Selection */}
              <div>
                <label className="block font-bold mb-1 text-amber-600 dark:text-amber-400">
                  Select Scoring Session *
                </label>
                <select
                  required
                  value={modalSessionId}
                  onChange={e => setModalSessionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border focus:outline-none font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {availableSessions.map(sess => (
                    <option key={sess.id} value={sess.id}>
                      {sess.name} {sess.day ? `(${sess.day})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delegate Selection */}
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Select Delegate Participant *
                </label>
                <select
                  required
                  value={modalStudentId}
                  onChange={e => setModalStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="">-- Choose delegate --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} (#{l.constituency_number ?? '?'} • {l.party_name || 'Independent'}) {!isParticipantActive(l) ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jury Selection */}
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Evaluating Juror *
                </label>
                {availableJuries.length > 0 ? (
                  <select
                    value={modalJuryName}
                    onChange={e => setModalJuryName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {availableJuries.map(j => (
                      <option key={j.id} value={j.name}>{j.name} ({j.designation || 'Juror'})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter juror name (e.g. Jury 1)"
                    value={modalJuryName}
                    onChange={e => setModalJuryName(e.target.value)}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                )}
              </div>

              {/* 6 Rubric Categories Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-[11px] font-bold mb-0.5">Research (/30): <span className="text-blue-500">{modalResearch}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={modalResearch}
                    onChange={e => setModalResearch(Number(e.target.value))}
                    className="w-full h-1.5 accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-[11px] font-bold mb-0.5">Relevance (/20): <span className="text-purple-500">{modalRelevance}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={modalRelevance}
                    onChange={e => setModalRelevance(Number(e.target.value))}
                    className="w-full h-1.5 accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-[11px] font-bold mb-0.5">Delivery (/20): <span className="text-emerald-500">{modalComm}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={modalComm}
                    onChange={e => setModalComm(Number(e.target.value))}
                    className="w-full h-1.5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-[11px] font-bold mb-0.5">Conduct (/12): <span className="text-amber-500">{modalConduct}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={modalConduct}
                    onChange={e => setModalConduct(Number(e.target.value))}
                    className="w-full h-1.5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-[11px] font-bold mb-0.5">Originality (/12): <span className="text-rose-500">{modalOriginality}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={modalOriginality}
                    onChange={e => setModalOriginality(Number(e.target.value))}
                    className="w-full h-1.5 accent-rose-500 cursor-pointer"
                  />
                </div>

                <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-[11px] font-bold mb-0.5">Time Mgmt (/6): <span className="text-cyan-500">{modalTime}</span></label>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    value={modalTime}
                    onChange={e => setModalTime(Number(e.target.value))}
                    className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Total Box */}
              <div className="p-2.5 rounded-xl border text-center font-black flex items-center justify-between px-4" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <span className="text-slate-400">Total Score:</span>
                <span className="text-amber-500 text-lg">{modalTotal} / 100</span>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Juror Remarks</label>
                <textarea
                  rows={2}
                  value={modalRemarks}
                  onChange={e => setModalRemarks(e.target.value)}
                  placeholder="Feedback on speech clarity, legislative posture, and motion delivery..."
                  className="w-full p-2.5 rounded-xl border focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              {/* Test Entry Checkbox */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
                <input
                  type="checkbox"
                  id="modalIsTest"
                  checked={modalIsTest}
                  onChange={e => setModalIsTest(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="modalIsTest" className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
                  Mark as Test Entry <span className="text-[10px] text-slate-400 font-normal">(Can be safely reset without affecting official scores)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--amber)' }}
                >
                  Save Score Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
