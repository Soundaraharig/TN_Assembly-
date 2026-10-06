import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  UserCheck,
  CheckCircle,
  Search,
  Sliders,
  MessageSquare,
  Save,
  LogOut,
  Calendar,
  History,
  Sun,
  Moon,
  Lock,
  LockOpen,
  ChevronUp,
  Delete,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckCircle2,
  Star,
  Mic,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import type { JuryMember, Learner, ScoreRecord, CollegeEvent, AgendaItem, ScoringSession, JuryEvaluation, SpeakingTurn } from '../../types';
import { useTheme } from '../../lib/theme';
import { storageService } from '../../services/storageService';
import { resolveCanonicalSession } from '../../utils/sessionUtils';

interface JuryDashboardProps {
  jury?: JuryMember | null;
  event?: CollegeEvent | null;
  learners: Learner[];
  agenda: AgendaItem[];
  scores: ScoreRecord[];
  onSaveScore: (score: ScoreRecord) => void;
  onLogout: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export type ScoringState = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTING' | 'OFFICIAL' | 'ADJUSTMENT';

// 6 Criterion Step Options matching requested rubric weights (Total = 100)
const RESEARCH_STEPS = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];      // Max 30
const RELEVANCE_STEPS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];      // Max 20
const COMM_STEPS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];           // Max 20
const CONDUCT_STEPS = [0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 12];           // Max 12
const ORIGINALITY_STEPS = [0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 12];       // Max 12
const TIME_STEPS = [0, 1, 2, 3, 4, 5, 6];                             // Max 6

export const JuryDashboard: React.FC<JuryDashboardProps> = ({
  jury,
  event,
  learners: propLearners,
  agenda,
  scores,
  onSaveScore,
  onLogout,
  onShowToast
}) => {
  const { theme, toggleTheme } = useTheme();
  // ── JURY RECOGNITION STATE & SYNC ──
  const [recogTick, setRecogTick] = useState(0);
  const [isTogglingRecog, setIsTogglingRecog] = useState(false);

  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterBench, setFilterBench] = useState<'ALL' | 'Ruling' | 'Opposition' | 'Independent'>('ALL');
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history' | 'agenda'>('evaluate');

  // Effective learners list with strict event scoping (P0 event isolation)
  const learners = useMemo(() => {
    if (!event?.id) return [];
    const scopedPropLearners = (propLearners || []).filter(
      learner => learner && learner.event_id === event.id
    );
    if (scopedPropLearners.length > 0) return scopedPropLearners;
    const scopedCached = storageService.getLearners(event.id).filter(
      learner => learner && learner.event_id === event.id
    );
    return scopedCached;
  }, [propLearners, event?.id, recogTick]);

  // Available Scoring Sessions (Zero Hour, Question Hour, Bill Presenting, etc.)
  const availableSessions = useMemo<ScoringSession[]>(() => {
    return storageService.getScoringSessions(event?.id || '');
  }, [event?.id, agenda]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const defaultSessions = storageService.getScoringSessions(event?.id || '');
    return defaultSessions[0]?.id || 'zero_hour';
  });

  const selectedSession = useMemo<ScoringSession>(() => {
    const found = availableSessions.find(s => s.id === selectedSessionId);
    return found || availableSessions[0] || { id: 'zero_hour', name: 'Zero Hour', is_canonical: true };
  }, [availableSessions, selectedSessionId]);

  const testMode = useMemo(() => {
    return storageService.getScoringTestMode(event?.id);
  }, [event?.id, recogTick]);
  const currentEnvironment = testMode.isTestMode ? 'test' : 'live';

  // Memoized O(1) Score Map for the active session (P1 Mobile CPU optimization)
  const currentSessionScoreMap = useMemo(() => {
    const map = new Map<string, ScoreRecord>();
    const isTest = testMode.isTestMode;
    const testRunId = testMode.testRunId;

    for (const s of scores) {
      if (
        (!event || !s.event_id || s.event_id === event.id) &&
        (s.session_id === selectedSession.id || s.session_name === selectedSession.name) &&
        ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))
      ) {
        if (isTest) {
          if (s.is_test && (!testRunId || s.test_run_id === testRunId)) {
            map.set(s.learner_id, s);
          }
        } else {
          if (!s.is_test) {
            map.set(s.learner_id, s);
          }
        }
      }
    }

    if (event?.id) {
      const evals = storageService.getJuryEvaluations(
        event.id,
        selectedSession.id,
        jury?.id || jury?.name,
        undefined,
        isTest
      );
      for (const e of evals) {
        if (!isTest && e.is_test) continue;
        if (isTest && (!e.is_test || (testRunId && e.test_run_id !== testRunId))) continue;
        if (!map.has(e.learner_id)) {
          map.set(e.learner_id, {
            id: e.id,
            event_id: e.event_id,
            session_id: e.session_id,
            session_name: e.session_name,
            learner_id: e.learner_id,
            learner_name: e.learner_name,
            jury_id: e.jury_id,
            juror_name: e.jury_name,
            total: e.total,
            feedback: e.feedback,
            is_test: e.is_test,
            test_run_id: e.test_run_id,
            created_at: e.created_at,
            updated_at: e.updated_at
          } as any);
        }
      }
    }
    return map;
  }, [scores, event?.id, selectedSession.id, selectedSession.name, jury?.id, jury?.name, testMode.isTestMode, testMode.testRunId, recogTick]);

  const handleSessionChange = (newSessionId: string) => {
    setSelectedSessionId(newSessionId);
    setLoadedKey(''); // Force reload for current delegate under new session
  };

  // 6 Rubric Scores State (Strict Turn-1 Draft Model: null = unanswered, 0..N = answered)
  const [researchScore, setResearchScore] = useState<number | null>(null);
  const [relevanceScore, setRelevanceScore] = useState<number | null>(null);
  const [commScore, setCommScore] = useState<number | null>(null);
  const [conductScore, setConductScore] = useState<number | null>(null);
  const [originalityScore, setOriginalityScore] = useState<number | null>(null);
  const [timeScore, setTimeScore] = useState<number | null>(null);

  const [feedback, setFeedback] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);

  // Multi-Turn Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjResearch, setAdjResearch] = useState<number>(2);
  const [adjRelevance, setAdjRelevance] = useState<number>(2);
  const [adjComm, setAdjComm] = useState<number>(2);
  const [adjConduct, setAdjConduct] = useState<number>(1);
  const [adjOriginality, setAdjOriginality] = useState<number>(1);
  const [adjTime, setAdjTime] = useState<number>(1);
  const [inspectingEvaluation, setInspectingEvaluation] = useState<JuryEvaluation | null>(null);

  // Jump to Participant Keypad State
  const [jumpInput, setJumpInput] = useState<string>('');
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(true);

  // Live Mode First Score Submission Warning Modal State
  const [hasAcknowledgedLiveWarning, setHasAcknowledgedLiveWarning] = useState<boolean>(false);
  const [isLiveWarningModalOpen, setIsLiveWarningModalOpen] = useState<boolean>(false);

  // Mobile Quick Search State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isMobileKeypadOpen, setIsMobileKeypadOpen] = useState<boolean>(false);

  const [liveAgenda, setLiveAgenda] = useState<AgendaItem[]>(agenda);

  useEffect(() => {
    setLiveAgenda(agenda);
  }, [agenda]);

  // Lazy load agenda on demand only when Jury member opens the Agenda tab
  useEffect(() => {
    if (activeTab === 'agenda' && event?.id) {
      storageService.fetchAgendaOnDemand(event.id).then(items => {
        if (items && items.length > 0) setLiveAgenda(items);
      }).catch(err => console.warn('[JuryDashboard] Lazy agenda fetch error:', err));
    }
  }, [activeTab, event?.id]);

  // Set default selected learner
  useEffect(() => {
    if (learners.length > 0 && !selectedLearnerId) {
      setSelectedLearnerId(learners[0].id);
    }
  }, [learners, selectedLearnerId]);

  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  // Authoritative current evaluation for this juror, participant, and canonical session
  const currentEvaluation = useMemo<JuryEvaluation | null>(() => {
    if (!selectedLearner || !event?.id) return null;
    const agendaItems = storageService.getAgenda(event.id);
    const resolved = resolveCanonicalSession(selectedSession.id, selectedSession.name, agendaItems);
    const evals = storageService.getJuryEvaluations(
      event.id,
      resolved.canonicalId,
      jury?.id || jury?.name,
      selectedLearner.id,
      testMode.isTestMode
    );
    return evals[0] || null;
  }, [event?.id, selectedSession, jury?.id, jury?.name, selectedLearner?.id, scores, recogTick, testMode.isTestMode]);

  // Mount effect: connect realtime, fetch cloud speaking turns, fetch recognitions & reconcile existing evaluation turns
  useEffect(() => {
    if (event?.id) {
      storageService.setupRealtimeSync(event.id);
      storageService.fetchSpeakingTurns(event.id).then(() => {
        storageService.reconcileEvaluationSpeakingTurns(event.id);
        setRecogTick(t => t + 1);
      }).catch(() => {});
      storageService.fetchJurySpeechRecognitions(event.id).then(() => {
        setRecogTick(t => t + 1);
      }).catch(() => {});
      const scopedProps = (propLearners || []).filter(l => l && l.event_id === event.id);
      if (scopedProps.length === 0) {
        const cached = storageService.getLearners(event.id).filter(l => l && l.event_id === event.id);
        if (cached.length === 0) {
          storageService.fetchEventLearners(event.id).then(() => {
            setRecogTick(t => t + 1);
          }).catch(() => {});
        }
      }
    }
  }, [event?.id, propLearners]);

  // Speaking turns for this delegate in the current canonical session
  const delegateSpeakingTurns = useMemo(() => {
    if (!event?.id || !selectedLearner) return [];
    const agendaItems = storageService.getAgenda(event.id);
    const resolved = resolveCanonicalSession(selectedSession.id, selectedSession.name, agendaItems);
    return storageService.getSpeakingTurns(event.id, undefined, currentEnvironment, testMode.testRunId)
      .filter(t => {
        if (t.event_id !== event.id || t.learner_id !== selectedLearner.id || t.status === 'CANCELLED') {
          return false;
        }
        const turnResolved = resolveCanonicalSession(t.session_id, t.session_name, agendaItems);
        return turnResolved.canonicalId === resolved.canonicalId;
      })
      .sort((a, b) => {
        const timeA = new Date(a.started_at || a.called_at || a.created_at || 0).getTime();
        const timeB = new Date(b.started_at || b.called_at || b.created_at || 0).getTime();
        return timeA - timeB;
      });
  }, [event?.id, selectedSession, selectedLearner, currentEnvironment, testMode.testRunId, recogTick]);

  // All speaking turns for this delegate across the event (fallback if session was recorded under general agenda)
  const allDelegateSpeakingTurns = useMemo(() => {
    if (!event?.id || !selectedLearner) return [];
    return storageService.getSpeakingTurns(event.id, undefined, currentEnvironment, testMode.testRunId)
      .filter(t => t.event_id === event.id && t.learner_id === selectedLearner.id && t.status !== 'CANCELLED')
      .sort((a, b) => {
        const timeA = new Date(a.started_at || a.called_at || a.created_at || 0).getTime();
        const timeB = new Date(b.started_at || b.called_at || b.created_at || 0).getTime();
        return timeA - timeB;
      });
  }, [event?.id, selectedLearner, currentEnvironment, testMode.testRunId, recogTick]);

  const effectiveDelegateTurns = delegateSpeakingTurns.length > 0 ? delegateSpeakingTurns : allDelegateSpeakingTurns;

  const currentTurnNumber = useMemo(() => {
    if (!currentEvaluation) return 1;
    const turnsRecorded = currentEvaluation.turns?.length || 0;
    return Math.max(2, turnsRecorded + 1, effectiveDelegateTurns.length);
  }, [currentEvaluation, effectiveDelegateTurns.length]);

  const lastSpeakerVersionRef = useRef<number>(0);

  // On mount: auto-select currently active floor speaker if one exists
  useEffect(() => {
    if (!event?.id) return;
    const active = storageService.getAuthoritativeCurrentSpeaker(event.id, undefined, currentEnvironment, testMode.testRunId);
    if (active && active.status === 'SPEAKING' && active.learner_id) {
      setSelectedLearnerId(active.learner_id);
    }
  }, [event?.id, currentEnvironment, testMode.testRunId]);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setRecogTick(t => t + 1);
    });

    const handleSpeakerChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      const detail = customEvt?.detail;
      const env = storageService.getScoringTestMode(event?.id);
      if (detail) {
        if (detail.isTest !== undefined && detail.isTest !== env.isTestMode) {
          return;
        }
        if (env.isTestMode && env.testRunId && detail.testRunId && detail.testRunId !== env.testRunId) {
          return;
        }
        if (detail.version && typeof detail.version === 'number') {
          if (detail.version < lastSpeakerVersionRef.current) {
            // Drop stale out-of-order event (Phase 19)
            return;
          }
          lastSpeakerVersionRef.current = detail.version;
        }

        if (detail.status === 'SPEAKING' && detail.learnerId) {
          setSelectedLearnerId(detail.learnerId);
        }
      } else {
        if (event?.id) {
          const active = storageService.getAuthoritativeCurrentSpeaker(event.id, undefined, env.isTestMode ? 'test' : 'live', env.testRunId);
          if (active && active.status === 'SPEAKING' && active.learner_id) {
            setSelectedLearnerId(active.learner_id);
          }
        }
      }
      setRecogTick(t => t + 1);
    };

    const handleRecogUpdate = () => {
      setRecogTick(t => t + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tn_assembly_current_speaker_changed', handleSpeakerChanged);
      window.addEventListener('tn_assembly_speaking_update', handleSpeakerChanged);
      window.addEventListener('tn_assembly_speaking_turn_update', handleSpeakerChanged);
      window.addEventListener('tn_assembly_jury_recognition_update', handleRecogUpdate);
      window.addEventListener('tn_assembly_test_mode_update', handleRecogUpdate);
      window.addEventListener('tn_assembly_scoring_environment_update', handleRecogUpdate);
      window.addEventListener('tn_assembly_scores_updated', handleRecogUpdate);
      window.addEventListener('tn_assembly_jury_scoring_reset', handleRecogUpdate);
      window.addEventListener('storage', handleRecogUpdate);
    }
    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('tn_assembly_current_speaker_changed', handleSpeakerChanged);
        window.removeEventListener('tn_assembly_speaking_update', handleSpeakerChanged);
        window.removeEventListener('tn_assembly_speaking_turn_update', handleSpeakerChanged);
        window.removeEventListener('tn_assembly_jury_recognition_update', handleRecogUpdate);
        window.removeEventListener('tn_assembly_test_mode_update', handleRecogUpdate);
        window.removeEventListener('tn_assembly_scoring_environment_update', handleRecogUpdate);
        window.removeEventListener('tn_assembly_scores_updated', handleRecogUpdate);
        window.removeEventListener('tn_assembly_jury_scoring_reset', handleRecogUpdate);
        window.removeEventListener('storage', handleRecogUpdate);
      }
    };
  }, [event?.id]);

  // Floor speaking turn currently active on the floor (status === 'SPEAKING' across entire event floor)
  const activeFloorSpeakingTurn = useMemo<SpeakingTurn | null>(() => {
    if (!event?.id) return null;
    return storageService.getAuthoritativeCurrentSpeaker(event.id, undefined, currentEnvironment, testMode.testRunId);
  }, [event?.id, currentEnvironment, testMode.testRunId, recogTick]);

  const activeFloorLearner = useMemo(() => {
    if (!activeFloorSpeakingTurn) return null;
    return learners.find(l => l.id === activeFloorSpeakingTurn.learner_id) || null;
  }, [activeFloorSpeakingTurn, learners]);

  // Pre-calculate recognitions count per participant across that MLA's speaking turns for CURRENT JUROR
  const learnerRecognitionsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!event?.id || !jury) return map;
    const juryId = jury.id || jury.name || 'jury';
    const recogs = storageService.getJurySpeechRecognitions(
      event.id,
      undefined,
      undefined,
      juryId,
      undefined,
      false,
      { environment: currentEnvironment, testRunId: testMode.testRunId }
    );
    recogs.forEach(r => {
      if (r.active && r.learner_id) {
        map.set(r.learner_id, (map.get(r.learner_id) || 0) + 1);
      }
    });
    return map;
  }, [event?.id, jury, currentEnvironment, testMode.testRunId, recogTick]);

  // Memoized Set of learnerIds recognized by current juror (O(1) lookup per student row)
  const recognizedLearnerIdsSet = useMemo(() => {
    const set = new Set<string>();
    if (!event?.id || !jury) return set;
    const juryId = jury.id || jury.name || 'jury';
    const recogs = storageService.getJurySpeechRecognitions(
      event.id,
      undefined,
      undefined,
      juryId,
      undefined,
      true, // activeOnly
      { environment: currentEnvironment, testRunId: testMode.testRunId }
    );
    recogs.forEach(r => {
      if (r.active && r.learner_id) {
        set.add(r.learner_id);
      }
    });
    return set;
  }, [event?.id, jury, currentEnvironment, testMode.testRunId, recogTick]);

  const isFloorTurnRecognized = Boolean(
    activeFloorSpeakingTurn && recognizedLearnerIdsSet.has(activeFloorSpeakingTurn.learner_id)
  );

  const handleToggleLearnerRecognition = async (learner: Learner, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!event?.id || !jury || isTogglingRecog) return;
    const juryId = jury.id || jury.name || 'jury';
    setIsTogglingRecog(true);
    try {
      const activeTurn = (activeFloorSpeakingTurn?.learner_id === learner.id ? activeFloorSpeakingTurn : null) ||
        delegateSpeakingTurns.find(t => t.learner_id === learner.id);
      const res = await storageService.toggleJurySpeechRecognition({
        eventId: event.id,
        sessionId: selectedSession.id,
        sessionName: selectedSession.name,
        speakingTurnId: activeTurn?.id,
        juryId,
        learnerId: learner.id,
        isTest: testMode.isTestMode,
        testRunId: testMode.testRunId || undefined
      });
      if (res.action === 'RECOGNIZED') {
        onShowToast('Delegate Recognized', `Recognized speech/performance by ${learner.full_name}.`, 'success');
      } else {
        onShowToast('Recognition Removed', `Removed recognition for ${learner.full_name}.`, 'info');
      }
    } catch (err: any) {
      onShowToast('Recognition Failed', err?.message || 'Unable to update recognition.', 'error');
    } finally {
      setIsTogglingRecog(false);
      setRecogTick(t => t + 1);
    }
  };

  const handleToggleRecognition = async (turn: SpeakingTurn) => {
    if (!event?.id || !jury || isTogglingRecog) return;
    const juryId = jury.id || jury.name || 'jury';
    setIsTogglingRecog(true);
    try {
      const res = await storageService.toggleJurySpeechRecognition({
        eventId: event.id,
        sessionId: turn.session_id || selectedSession.id,
        sessionName: turn.session_name || selectedSession.name,
        speakingTurnId: turn.id,
        juryId,
        learnerId: turn.learner_id,
        isTest: testMode.isTestMode,
        testRunId: testMode.testRunId || undefined
      });
      if (res.action === 'RECOGNIZED') {
        onShowToast('Speech Liked', `You liked the speech by ${turn.learner_name || 'Delegate'}.`, 'success');
      } else {
        onShowToast('Like Removed', `Like removed for ${turn.learner_name || 'Delegate'}.`, 'info');
      }
    } catch (err: any) {
      onShowToast('Like Action Failed', err.message || 'Unable to update like.', 'error');
    } finally {
      setIsTogglingRecog(false);
      setRecogTick(t => t + 1);
    }
  };

  const [loadedKey, setLoadedKey] = useState<string>('');

  // Load existing score or draft when selected learner OR selected session changes
  useEffect(() => {
    if (!selectedLearnerId || !selectedSession) return;
    const currentKey = `${selectedLearnerId}:::${selectedSession.id}:::${currentEvaluation?.id || 'none'}:::${currentEvaluation?.total ?? 'null'}:::${recogTick}`;
    if (loadedKey === currentKey) return;

    // Check if an official evaluation actually exists (strict authoritative source)
    const existing = currentEvaluation;

    if (existing) {
      setResearchScore(existing.research_constituency ?? null);
      setRelevanceScore(existing.relevance_agenda ?? null);
      setCommScore(existing.communication_delivery ?? null);
      setConductScore(existing.parliamentary_conduct ?? null);
      setOriginalityScore(existing.originality_preparation ?? null);
      setTimeScore(existing.time_management ?? null);
      setIsLocked(Boolean((existing as any).is_locked || existing.status === 'LOCKED'));
      setFeedback(existing.feedback || '');
      setDraftSavedAt(null);
    } else {
      // Check if a local temporary draft exists (never saved to database or official evaluations)
      const draft = event?.id && (jury?.id || jury?.name)
        ? storageService.getJuryDraft(event.id, selectedSession.id, jury.id || jury.name || 'jury', selectedLearnerId)
        : null;

      if (draft) {
        setResearchScore(draft.research ?? null);
        setRelevanceScore(draft.relevance ?? null);
        setCommScore(draft.comm ?? null);
        setConductScore(draft.conduct ?? null);
        setOriginalityScore(draft.originality ?? null);
        setTimeScore(draft.time ?? null);
        setIsLocked(false);
        setFeedback(draft.feedback || '');
        if (draft.updatedAt) {
          try {
            setDraftSavedAt(new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } catch {
            setDraftSavedAt(null);
          }
        } else {
          setDraftSavedAt(null);
        }
      } else {
        // Strict Turn-1 Draft Model: Unanswered categories default to null (NOT zero)
        setResearchScore(null);
        setRelevanceScore(null);
        setCommScore(null);
        setConductScore(null);
        setOriginalityScore(null);
        setTimeScore(null);
        setIsLocked(false);
        setFeedback('');
        setDraftSavedAt(null);
      }
    }
    setLoadedKey(currentKey);
  }, [selectedLearnerId, selectedSession.id, currentEvaluation, recogTick, event?.id, jury, loadedKey]);

  // Draft save timestamp display
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Explicit completion check: distinguish UNANSWERED (null) vs ANSWERED (number, including legitimate 0)
  const isCategoryAnswered = (val: number | null): val is number => typeof val === 'number' && !isNaN(val);

  const answeredCategoriesCount = [
    isCategoryAnswered(researchScore),
    isCategoryAnswered(relevanceScore),
    isCategoryAnswered(commScore),
    isCategoryAnswered(conductScore),
    isCategoryAnswered(originalityScore),
    isCategoryAnswered(timeScore)
  ].filter(Boolean).length;

  const isEvaluationComplete = answeredCategoriesCount === 6;

  const totalScore = (researchScore ?? 0) +
    (relevanceScore ?? 0) +
    (commScore ?? 0) +
    (conductScore ?? 0) +
    (originalityScore ?? 0) +
    (timeScore ?? 0);

  // Authoritative Jury Scoring State Machine
  const scoringState: ScoringState = useMemo(() => {
    if (isSubmittingEvaluation) return 'SUBMITTING';
    if (isAdjustmentModalOpen) return 'ADJUSTMENT';
    if (currentEvaluation) return 'OFFICIAL';
    if (answeredCategoriesCount > 0 || feedback.trim().length > 0) return 'DRAFT';
    return 'NOT_STARTED';
  }, [isSubmittingEvaluation, isAdjustmentModalOpen, currentEvaluation, answeredCategoriesCount, feedback]);

  // Category selection is a UI-only operation that updates local draft state (0 DB / Supabase writes)
  const handleSelectScore = (type: 'research' | 'relevance' | 'comm' | 'conduct' | 'originality' | 'time', val: number) => {
    if (isLocked) return;

    let newR = researchScore;
    let newRel = relevanceScore;
    let newC = commScore;
    let newCond = conductScore;
    let newOrig = originalityScore;
    let newT = timeScore;

    if (type === 'research') {
      newR = val;
      setResearchScore(val);
    } else if (type === 'relevance') {
      newRel = val;
      setRelevanceScore(val);
    } else if (type === 'comm') {
      newC = val;
      setCommScore(val);
    } else if (type === 'conduct') {
      newCond = val;
      setConductScore(val);
    } else if (type === 'originality') {
      newOrig = val;
      setOriginalityScore(val);
    } else if (type === 'time') {
      newT = val;
      setTimeScore(val);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDraftSavedAt(timeStr);

    // Persist draft in localStorage only for crash/tab survival; NEVER writes to official evaluations or Supabase
    if (event?.id && selectedLearner?.id && (jury?.id || jury?.name)) {
      storageService.saveJuryDraft(
        event.id,
        selectedSession.id,
        jury.id || jury.name || 'jury',
        selectedLearner.id,
        {
          research: newR,
          relevance: newRel,
          comm: newC,
          conduct: newCond,
          originality: newOrig,
          time: newT,
          feedback: feedback,
          updatedAt: new Date().toISOString()
        }
      );
    }
  };

  const handleFeedbackChange = (val: string) => {
    setFeedback(val);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDraftSavedAt(timeStr);

    if (event?.id && selectedLearner?.id && (jury?.id || jury?.name)) {
      storageService.saveJuryDraft(
        event.id,
        selectedSession.id,
        jury.id || jury.name || 'jury',
        selectedLearner.id,
        {
          research: researchScore,
          relevance: relevanceScore,
          comm: commScore,
          conduct: conductScore,
          originality: originalityScore,
          time: timeScore,
          feedback: val,
          updatedAt: new Date().toISOString()
        }
      );
    }
  };

  const handleSaveDraft = () => {
    if (!event?.id || !selectedLearner?.id || (!jury?.id && !jury?.name)) return;
    storageService.saveJuryDraft(
      event.id,
      selectedSession.id,
      jury.id || jury.name || 'jury',
      selectedLearner.id,
      {
        research: researchScore,
        relevance: relevanceScore,
        comm: commScore,
        conduct: conductScore,
        originality: originalityScore,
        time: timeScore,
        feedback: feedback,
        updatedAt: new Date().toISOString()
      }
    );
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDraftSavedAt(timeStr);
    onShowToast('Draft Saved', `Draft for ${selectedLearner.full_name} saved locally (${answeredCategoriesCount}/6 categories). Not submitted as official evaluation.`, 'info');
  };

  // Jump To Participant Keypad Actions
  const handleJumpInputChange = (query: string) => {
    setJumpInput(query);
    const cleaned = query.trim().replace(/^#/, '');
    if (!cleaned) return;

    const num = parseInt(cleaned, 10);
    const matched = learners.find(l => {
      const constNum = l.constituency_number ?? (l as any).roll_no;
      return (
        (!isNaN(num) && num > 0 && constNum === num) ||
        (constNum !== undefined && String(constNum).trim() === cleaned) ||
        (l.access_code && l.access_code.toUpperCase() === cleaned.toUpperCase())
      );
    });
    if (matched) {
      setSelectedLearnerId(matched.id);
    }
  };

  const handleKeypadPress = (val: string) => {
    const nextVal = jumpInput + val;
    handleJumpInputChange(nextVal);
  };

  const handleKeypadBackspace = () => {
    const nextVal = jumpInput.slice(0, -1);
    handleJumpInputChange(nextVal);
  };

  const handleKeypadClear = () => {
    setJumpInput('');
  };

  // Next / Previous Delegate Navigation
  const currentIndex = learners.findIndex(l => l.id === selectedLearnerId);
  const handlePrevDelegate = () => {
    if (currentIndex > 0) {
      setSelectedLearnerId(learners[currentIndex - 1].id);
    }
  };
  const handleNextDelegate = () => {
    if (currentIndex >= 0 && currentIndex < learners.length - 1) {
      setSelectedLearnerId(learners[currentIndex + 1].id);
    }
  };

  const handleOpenAdjustmentModal = () => {
    if (!currentEvaluation) return;
    setAdjResearch(currentEvaluation.research_constituency);
    setAdjRelevance(currentEvaluation.relevance_agenda);
    setAdjComm(currentEvaluation.communication_delivery);
    setAdjConduct(currentEvaluation.parliamentary_conduct);
    setAdjOriginality(currentEvaluation.originality_preparation);
    setAdjTime(currentEvaluation.time_management);
    setAdjustmentReason('');
    setIsAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = () => {
    if (!currentEvaluation || !selectedLearner || !event?.id) return;
    const reason = adjustmentReason.trim();
    if (!reason) {
      onShowToast('Reason Required', 'Score adjustment requires a valid justification for the audit trail.', 'error');
      return;
    }

    const activeTurn = (activeFloorSpeakingTurn?.learner_id === selectedLearner.id ? activeFloorSpeakingTurn : null) ||
      effectiveDelegateTurns.find(t => t.status === 'SPEAKING' || t.status === 'SPOKEN') ||
      effectiveDelegateTurns[effectiveDelegateTurns.length - 1];
    const turnId = activeTurn?.id || '';

    const prevTotal = currentEvaluation.total;
    const updated = storageService.recordScoreAdjustment({
      evaluationId: currentEvaluation.id,
      speakingTurnId: turnId,
      jurorId: jury?.id || jury?.name || 'jury',
      jurorName: jury?.name || 'Evaluator',
      research_constituency: adjResearch,
      relevance_agenda: adjRelevance,
      communication_delivery: adjComm,
      parliamentary_conduct: adjConduct,
      originality_preparation: adjOriginality,
      time_management: adjTime,
      adjustmentReason: reason
    });

    setIsAdjustmentModalOpen(false);
    const delta = updated.total - prevTotal;
    onShowToast(
      'Score Adjusted',
      `Updated score for ${selectedLearner.full_name} to ${updated.total}/100 (${delta >= 0 ? '+' : ''}${delta}). Reason logged in audit trail.`,
      'success'
    );
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner || !event?.id || isSubmittingEvaluation) return;

    if (!isEvaluationComplete) {
      onShowToast(
        'Incomplete Evaluation',
        `Please complete all 6 scoring categories (${6 - answeredCategoriesCount} remaining) before submitting.`,
        'error'
      );
      return;
    }

    // In LIVE mode, prompt once before creating the first official evaluation
    if (!testMode.isTestMode && !hasAcknowledgedLiveWarning) {
      setIsLiveWarningModalOpen(true);
      return;
    }

    executeActualSubmission();
  };

  const executeActualSubmission = () => {
    if (!selectedLearner || !event?.id || isSubmittingEvaluation) return;
    setIsSubmittingEvaluation(true);
    try {
      const activeTurn = (activeFloorSpeakingTurn?.learner_id === selectedLearner.id ? activeFloorSpeakingTurn : null) ||
        effectiveDelegateTurns.find(t => t.status === 'SPEAKING' || t.status === 'SPOKEN') ||
        effectiveDelegateTurns[0];
      const turnId = activeTurn?.id || '';

      const savedEval = storageService.recordInitialEvaluation({
        eventId: event.id,
        sessionId: selectedSession.id,
        sessionName: selectedSession.name,
        learnerId: selectedLearner.id,
        learnerName: selectedLearner.full_name,
        constituencyNumber: selectedLearner.constituency_number,
        constituencyName: selectedLearner.constituency_name,
        partyName: selectedLearner.party_name,
        bench: selectedLearner.bench,
        juryId: jury?.id || jury?.name || 'jury',
        juryName: jury?.name || 'Evaluator',
        isTest: testMode.isTestMode,
        testRunId: testMode.testRunId || undefined,
        research_constituency: researchScore!,
        relevance_agenda: relevanceScore!,
        communication_delivery: commScore!,
        parliamentary_conduct: conductScore!,
        originality_preparation: originalityScore!,
        time_management: timeScore!,
        speakingTurnId: turnId,
        feedback: feedback
      });

      // Clear local draft now that official evaluation is submitted
      storageService.clearJuryDraft(
        event.id,
        selectedSession.id,
        jury?.id || jury?.name || 'jury',
        selectedLearner.id
      );

      // Notify parent if onSaveScore is passed to refresh scores state
      if (onSaveScore) {
        onSaveScore({
          id: savedEval.id,
          event_id: savedEval.event_id,
          session_id: savedEval.session_id,
          session_name: savedEval.session_name,
          learner_id: savedEval.learner_id,
          learner_name: savedEval.learner_name,
          constituency_number: savedEval.constituency_number,
          constituency_name: savedEval.constituency_name,
          party_name: savedEval.party_name,
          bench: savedEval.bench,
          jury_id: savedEval.jury_id,
          juror_name: savedEval.jury_name,
          research_constituency: savedEval.research_constituency,
          relevance_agenda: savedEval.relevance_agenda,
          communication_delivery: savedEval.communication_delivery,
          parliamentary_conduct: savedEval.parliamentary_conduct,
          originality_preparation: savedEval.originality_preparation,
          time_management: savedEval.time_management,
          oratory: savedEval.communication_delivery,
          policy_knowledge: savedEval.research_constituency,
          rebuttal_debate: savedEval.relevance_agenda,
          total: savedEval.total,
          feedback: savedEval.feedback || '',
          is_test: savedEval.is_test,
          test_run_id: savedEval.test_run_id,
          is_locked: false,
          created_at: savedEval.created_at,
          updated_at: savedEval.updated_at
        });
      }

      setRecogTick(t => t + 1);
      setIsSavedRecently(true);
      setDraftSavedAt(null);
      setTimeout(() => setIsSavedRecently(false), 3000);
      onShowToast('✓ Official Evaluation Saved', `Recorded official Turn 1 evaluation (${savedEval.total}/100) for ${selectedLearner.full_name}`, 'success');
    } catch (err: any) {
      onShowToast('Save failed — Retry', err.message || 'Error submitting official evaluation.', 'error');
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const filteredLearners = useMemo(() => {
    const rawSearch = search.trim();
    const q = rawSearch.toLowerCase();
    const qNoHash = q.startsWith('#') ? q.slice(1).trim() : q;

    return learners.filter(l => {
      const matchesBench = filterBench === 'ALL' || l.bench === filterBench;
      if (!matchesBench) return false;

      if (!rawSearch) return true;

      const constNum = l.constituency_number ?? (l as any).roll_no;
      const constNumStr = constNum !== undefined && constNum !== null ? String(constNum).trim() : '';

      const nameMatch = Boolean(l.full_name && l.full_name.toLowerCase().includes(q));
      const partyMatch = Boolean(l.party_name && l.party_name.toLowerCase().includes(q));
      const constNameMatch = Boolean(l.constituency_name && l.constituency_name.toLowerCase().includes(q));
      const codeMatch = Boolean(l.access_code && l.access_code.toLowerCase().includes(q));

      const constNumMatch = Boolean(
        constNumStr && (
          constNumStr === q ||
          constNumStr === qNoHash ||
          constNumStr.includes(qNoHash)
        )
      );

      return nameMatch || partyMatch || constNameMatch || codeMatch || constNumMatch;
    });
  }, [learners, search, filterBench]);

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { label: 'Distinction (A+)', color: 'var(--emerald)' };
    if (score >= 75) return { label: 'Commendation (A)', color: 'var(--accent)' };
    if (score >= 60) return { label: 'Proficient (B)', color: 'var(--amber)' };
    return { label: 'Needs Improvement (C)', color: '#ef4444' };
  };

  const grade = getScoreGrade(totalScore);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Header */}
      <header
        className="px-3 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 sticky top-0 z-30 shadow-sm max-w-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl border flex items-center justify-center"
            style={{
              background: 'var(--amber-soft)',
              color: 'var(--amber)',
              borderColor: 'var(--amber)'
            }}
          >
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Jury Evaluation Portal
              </h1>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                {event?.college_name || 'Youth TN Assembly Platform'}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Evaluator: <strong style={{ color: 'var(--text-primary)' }}>{jury?.name || 'Honorable Juror'}</strong>
              {jury?.designation && ` • ${jury.designation}`}
              {jury?.assigned_bench && (
                <span className="ml-1.5 font-semibold" style={{ color: jury.assigned_bench === 'Ruling' ? 'var(--emerald)' : '#ef4444' }}>
                  ({jury.assigned_bench} Bench)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-colors cursor-pointer hover:opacity-80"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('evaluate')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'evaluate' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'evaluate' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'evaluate' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <Sliders className="w-3.5 h-3.5" /> Evaluate
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'history' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'history' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <History className="w-3.5 h-3.5" /> Score History ({scores.filter(s => (!event || !s.event_id || s.event_id === event.id) && ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))).length})
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'agenda' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'agenda' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'agenda' ? '#fff' : 'var(--text-primary)'
              }}
            >
              <Calendar className="w-3.5 h-3.5" /> Agenda
            </button>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 cursor-pointer"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* SCORING ENVIRONMENT BANNER (PHASE 19) */}
        {testMode.isTestMode ? (
          <div className="rounded-2xl p-4 border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <span>🟠</span>
                <span>TEST MODE</span>
              </div>
              <div>
                <p className="text-xs font-black text-amber-700 dark:text-amber-300">
                  Scores entered here are test data and can be safely reset.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Isolated under Test Run #{testMode.testRunId?.slice(0, 8)} • Will NOT affect official assembly results.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Run: {testMode.testRunId || 'test_run'}
            </span>
          </div>
        ) : (
          <div className="rounded-2xl p-3 px-4 border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                <span>🟢</span>
                <span>LIVE PRODUCTION</span>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Scores entered here affect official jury records.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Official 100-point rubric scores will be permanently recorded for {event?.college_name || 'Assembly'}.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Official Ledger
            </span>
          </div>
        )}

        {/* PROMINENT SESSION SELECTOR BANNER */}
        <div
          className="rounded-2xl p-4 md:p-5 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  SCORING SESSION
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Independent Scores
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                Current Session: <span className="text-amber-600 dark:text-amber-400">{selectedSession.name}</span>
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Current Jury: <strong style={{ color: 'var(--text-primary)' }}>{jury?.name || 'Evaluator'}</strong>
                {selectedSession.day && ` • ${selectedSession.day}`}
                {selectedSession.time && ` • ${selectedSession.time}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
                Session:
              </label>
              <select
                value={selectedSession.id}
                onChange={e => handleSessionChange(e.target.value)}
                className="font-extrabold text-sm py-2 px-3.5 rounded-xl border border-amber-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer shadow-sm focus:ring-2 focus:ring-amber-500/50"
              >
                {availableSessions.map(sess => (
                  <option key={sess.id} value={sess.id}>
                    {sess.name} {sess.day ? `(${sess.day})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-right hidden sm:block pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Session Progress
              </span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                {scores.filter(s =>
                  (!event || !s.event_id || s.event_id === event.id) &&
                  (s.session_id === selectedSession.id || s.session_name === selectedSession.name) &&
                  ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))
                ).length} / {learners.length} Evaluated
              </span>
            </div>
          </div>
        </div>

        {activeTab === 'evaluate' && (
          <div className="space-y-6">
            {/* MOBILE QUICK SEARCH & DELEGATE SWITCHER (Prominent at top on mobile) */}
            <div className="lg:hidden rounded-2xl p-4 border shadow-md space-y-3 bg-white dark:bg-slate-900 border-amber-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Quick Search & Score
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Find any student by name, seat #, or constituency
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileKeypadOpen(!isMobileKeypadOpen)}
                  className={`px-3 py-1.5 min-h-[44px] rounded-xl text-xs font-bold font-mono border transition flex items-center justify-center gap-1 cursor-pointer ${
                    isMobileKeypadOpen
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>#</span> Keypad
                </button>
              </div>

              {/* Search input with live autocomplete */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, constituency number or constituency..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setIsMobileSearchOpen(true);
                  }}
                  onFocus={() => setIsMobileSearchOpen(true)}
                  className="w-full pl-9 pr-9 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setIsMobileSearchOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Keypad Drawer when toggled */}
              {isMobileKeypadOpen && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                      DIAL SEAT #: <strong className="text-amber-600 dark:text-amber-400 text-xs">{jumpInput || '_'}</strong>
                    </span>
                    {jumpInput && (
                      <button
                        type="button"
                        onClick={handleKeypadClear}
                        className="text-[11px] font-bold text-rose-500 hover:underline min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-1 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num)}
                        className="py-2.5 min-h-[44px] rounded-xl border border-amber-200/80 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-extrabold text-sm hover:bg-amber-100 dark:hover:bg-slate-600 active:scale-95 transition cursor-pointer shadow-2xs flex items-center justify-center"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileKeypadOpen(false)}
                      className="py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-emerald-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                      title="Done"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )}

              {/* Live search results dropdown on mobile */}
              {isMobileSearchOpen && search.trim() && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-amber-500/30 bg-white dark:bg-slate-900 shadow-2xl space-y-1 p-1.5 z-20">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <span>MATCHING STUDENTS ({filteredLearners.length})</span>
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="text-amber-500 hover:underline cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                    >
                      Close ✕
                    </button>
                  </div>
                  {filteredLearners.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No delegates found matching "{search}"
                    </div>
                  ) : (
                    filteredLearners.slice(0, 20).map(learner => {
                      const isSelected = learner.id === selectedLearnerId;
                      const existingScore = currentSessionScoreMap.get(learner.id);
                      const constNum = learner.constituency_number ?? (learner as any).roll_no;
                      const constName = learner.constituency_name || learner.role || 'Assembly Seat';

                      const isRecognized = recognizedLearnerIdsSet.has(learner.id);

                      return (
                        <div
                          key={learner.id}
                          className={`w-full p-2.5 rounded-xl border transition flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLearnerId(learner.id);
                              setIsMobileSearchOpen(false);
                              setSearch('');
                            }}
                            className="min-w-0 pr-1 flex-1 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {learner.full_name}
                              </span>
                              {existingScore && (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                              {constNum !== undefined && constNum !== null ? `#${constNum} • ` : ''}{constName}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {learner.party_name || 'Independent'} • {learner.bench || 'Ruling'}
                            </p>
                          </button>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {/* Small Star Recognition Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleLearnerRecognition(learner, e)}
                              aria-label={isRecognized ? `Remove recognition for ${learner.full_name}` : `Recognize ${learner.full_name}`}
                              title={isRecognized ? `Remove recognition for ${learner.full_name}` : `Recognize ${learner.full_name}`}
                              className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors cursor-pointer select-none ${
                                isRecognized
                                  ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                                  : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <span className="text-base font-bold leading-none" aria-hidden="true">
                                {isRecognized ? '★' : '☆'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLearnerId(learner.id);
                                setIsMobileSearchOpen(false);
                                setSearch('');
                              }}
                              className="text-right shrink-0 flex flex-col items-end justify-center gap-1 cursor-pointer"
                            >
                              {constNum !== undefined && constNum !== null && (
                                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                  #{constNum}
                                </span>
                              )}
                              {existingScore ? (
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  {existingScore.total}/100
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  Score Now
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Bench filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Bench:
                </span>
                {(['ALL', 'Ruling', 'Opposition', 'Independent'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFilterBench(b)}
                    className={`px-3 py-1.5 min-h-[44px] inline-flex items-center justify-center rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                      filterBench === b
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs font-extrabold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Active delegate mini stepper banner */}
              {selectedLearner && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handlePrevDelegate}
                    disabled={currentIndex <= 0}
                    className="p-1.5 min-h-[44px] min-w-[44px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                    title="Previous Student"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-center min-w-0 flex-1 px-1">
                    <div className="flex items-center justify-center gap-1.5 truncate">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {selectedLearner.full_name}
                      </span>
                      {(selectedLearner.constituency_number ?? (selectedLearner as any).roll_no) !== undefined && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          #{selectedLearner.constituency_number ?? (selectedLearner as any).roll_no}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {(selectedLearner.constituency_number ?? (selectedLearner as any).roll_no) !== undefined ? `#${selectedLearner.constituency_number ?? (selectedLearner as any).roll_no} • ` : ''}{selectedLearner.constituency_name || 'Assembly Seat'} • {selectedLearner.party_name || 'Independent'} ({selectedLearner.bench || 'Ruling'})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextDelegate}
                    disabled={currentIndex >= learners.length - 1}
                    className="p-1.5 min-h-[44px] min-w-[44px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                    title="Next Student"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Middle: Rubric Evaluation Form (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* NOW SPEAKING Floor Banner (Phase 7, 11, 12, 32) */}
              {activeFloorSpeakingTurn && activeFloorSpeakingTurn.status === 'SPEAKING' ? (
                <div className="rounded-2xl p-3.5 sm:p-5 border bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border-rose-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-md max-w-full overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shrink-0 ring-4 ring-rose-500/20">
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs flex items-center gap-1 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                          🔴 NOW SPEAKING
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                          Speaking Turn {activeFloorSpeakingTurn.sequence_number || 1}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
                        {activeFloorSpeakingTurn.learner_name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                        {activeFloorLearner?.constituency_number !== undefined ? `Constituency #${activeFloorLearner.constituency_number} — ` : ''}
                        {activeFloorLearner?.constituency_name || 'Assembly Delegate'} • {activeFloorLearner?.bench || 'Ruling'} Bench
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
                    {/* Compact personal like count beside MLA */}
                    <div className="text-center px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-xs flex sm:flex-col items-center justify-between sm:justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Speeches Liked
                      </p>
                      <p className="text-sm sm:text-base font-black font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                        ⭐ {learnerRecognitionsCountMap.get(activeFloorSpeakingTurn.learner_id) || 0}
                      </p>
                    </div>

                    {/* Single LIKE button for this current speaking turn */}
                    <button
                      type="button"
                      disabled={isTogglingRecog}
                      onClick={() => handleToggleRecognition(activeFloorSpeakingTurn)}
                      className={`w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 ${
                        isFloorTurnRecognized
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 ring-2 ring-amber-400'
                          : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-2 border-amber-500/60 hover:bg-amber-50 dark:hover:bg-slate-800'
                      }`}
                      title={isFloorTurnRecognized ? 'Click to unlike this speech' : 'Click to like this speech'}
                    >
                      <Star className={`w-5 h-5 ${isFloorTurnRecognized ? 'fill-current text-white' : 'text-amber-500'}`} />
                      <span>{isFloorTurnRecognized ? '⭐ LIKED ✓' : '⭐ LIKE THIS SPEECH'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    🔵 NO SPEAKER ACTIVE (Waiting for Speaker Aid...)
                  </span>
                  <span className="text-[11px] italic">Like button activates automatically when Speaker Aid starts an MLA's speech.</span>
                </div>
              )}

              {selectedLearner ? (
                currentEvaluation ? (
                  <div className="rounded-2xl p-3.5 sm:p-6 border space-y-4 sm:space-y-6 shadow-sm max-w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    {/* Header: Existing Evaluation Banner */}
                    <div className="flex flex-wrap items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Existing Session Evaluation
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            Speaking Turn {currentTurnNumber}
                          </span>
                        </div>
                        <h2 className="text-xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                          {selectedLearner.full_name}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {(selectedLearner.constituency_number ?? (selectedLearner as any).roll_no) !== undefined ? `#${selectedLearner.constituency_number ?? (selectedLearner as any).roll_no} • ` : ''}
                          {selectedLearner.constituency_name || 'Assembly Seat'} • {selectedLearner.party_name || 'Independent'} ({selectedLearner.bench || 'Ruling'} Bench)
                        </p>
                      </div>

                      {/* Official Score badge & Stepper */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={handlePrevDelegate}
                            disabled={currentIndex <= 0}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Previous Delegate"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-mono font-bold px-2 text-slate-500">
                            {currentIndex + 1} / {learners.length}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextDelegate}
                            disabled={currentIndex >= learners.length - 1}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Next Delegate"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Juror's Speech Likes Count for this MLA */}
                        <div className="text-center px-3.5 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Speeches Liked
                          </p>
                          <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                            ⭐ {learnerRecognitionsCountMap.get(selectedLearner.id) || 0}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Current Official Score
                          </p>
                          <p className="text-2xl font-black font-mono text-amber-500">
                            {currentEvaluation.total} <span className="text-xs font-semibold text-slate-400">/ 100</span>
                          </p>
                          <p className="text-[10px] font-bold" style={{ color: grade.color }}>
                            {grade.label}
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenAdjustmentModal}
                            className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1 ml-auto"
                            title="Adjust official score with audit trail"
                          >
                            <Edit3 className="w-3 h-3" /> Adjust Score
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown of Current Official Rubric Scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Research</span>
                        <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">{currentEvaluation.research_constituency}</span>
                        <span className="text-[10px] text-slate-400">/30</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Agenda</span>
                        <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">{currentEvaluation.relevance_agenda}</span>
                        <span className="text-[10px] text-slate-400">/20</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivery</span>
                        <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{currentEvaluation.communication_delivery}</span>
                        <span className="text-[10px] text-slate-400">/20</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Conduct</span>
                        <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">{currentEvaluation.parliamentary_conduct}</span>
                        <span className="text-[10px] text-slate-400">/12</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Originality</span>
                        <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">{currentEvaluation.originality_preparation}</span>
                        <span className="text-[10px] text-slate-400">/12</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Time</span>
                        <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">{currentEvaluation.time_management}</span>
                        <span className="text-[10px] text-slate-400">/6</span>
                      </div>
                    </div>

                    {currentEvaluation.feedback && (
                      <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold text-slate-500 block mb-1">Juror Remarks:</span>
                        <p className="italic text-slate-700 dark:text-slate-300">"{currentEvaluation.feedback}"</p>
                      </div>
                    )}

                  </div>
                ) : (
                <form onSubmit={handleSaveEvaluation} className="rounded-2xl p-3.5 sm:p-6 border space-y-4 sm:space-y-6 shadow-sm max-w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  
                  {/* Delegate Header Info & Stepper */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          NEW EVALUATION
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                          Speaking Turn 1
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          scoringState === 'OFFICIAL'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : scoringState === 'SUBMITTING'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse'
                            : answeredCategoriesCount > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}>
                          {scoringState === 'OFFICIAL'
                            ? 'OFFICIAL EVALUATION'
                            : scoringState === 'SUBMITTING'
                            ? 'SUBMITTING...'
                            : scoringState === 'DRAFT'
                            ? `Draft — Not Submitted (${answeredCategoriesCount}/6 completed)`
                            : 'NOT STARTED'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                          {selectedLearner.full_name}
                        </h2>
                        {(selectedLearner.constituency_number ?? (selectedLearner as any).roll_no) !== undefined && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            #{selectedLearner.constituency_number ?? (selectedLearner as any).roll_no}
                          </span>
                        )}
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            background: selectedLearner.bench === 'Ruling' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                            color: selectedLearner.bench === 'Ruling' ? 'var(--emerald)' : '#ef4444',
                            borderColor: selectedLearner.bench === 'Ruling' ? 'var(--emerald)' : '#ef4444'
                          }}
                        >
                          {selectedLearner.bench || 'Ruling'} Bench
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Constituency:{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>
                          {(selectedLearner.constituency_number ?? (selectedLearner as any).roll_no) !== undefined ? `#${selectedLearner.constituency_number ?? (selectedLearner as any).roll_no} • ` : ''}
                          {selectedLearner.constituency_name || selectedLearner.role || 'Floor Delegate'}
                        </strong> • Party:{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>{selectedLearner.party_name || 'Independent'}</strong>
                      </p>
                    </div>

                    {/* Navigation Buttons + Aggregate Score */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={handlePrevDelegate}
                          disabled={currentIndex <= 0}
                          className="p-1.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                          title="Previous Delegate"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-bold px-2 text-slate-500">
                          {currentIndex + 1} / {learners.length}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextDelegate}
                          disabled={currentIndex >= learners.length - 1}
                          className="p-1.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                          title="Next Delegate"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Juror's Speech Likes Count for this MLA */}
                      <div className="text-center px-3.5 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Speeches Liked
                        </p>
                        <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                          ⭐ {learnerRecognitionsCountMap.get(selectedLearner.id) || 0}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Total Score
                        </p>
                        <p className="text-2xl font-black" style={{ color: isEvaluationComplete ? 'var(--amber)' : 'var(--text-muted)' }}>
                          {totalScore} <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>/ 100</span>
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: isEvaluationComplete ? grade.color : '#f59e0b' }}>
                          {isEvaluationComplete ? grade.label : `Draft (${answeredCategoriesCount}/6 completed)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6 Rubric Criteria Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Card 1: Research & Constituency Understanding (Max 30) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          Research & Constituency Understanding
                          {researchScore !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unanswered</span>
                          )}
                        </span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{researchScore !== null ? researchScore : '—'}</strong>
                          <span className="text-slate-400 text-xs">/30</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${researchScore !== null ? (researchScore / 30) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Pill Selection Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {RESEARCH_STEPS.map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScore('research', val)}
                            className={`px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              researchScore === val
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card 2: Relevance to Central Agenda (Max 20) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          Relevance to Central Agenda
                          {relevanceScore !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unanswered</span>
                          )}
                        </span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{relevanceScore !== null ? relevanceScore : '—'}</strong>
                          <span className="text-slate-400 text-xs">/20</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${relevanceScore !== null ? (relevanceScore / 20) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Pill Selection Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {RELEVANCE_STEPS.map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScore('relevance', val)}
                            className={`px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              relevanceScore === val
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card 3: Communication & Delivery (Max 20) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          Communication & Delivery
                          {commScore !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unanswered</span>
                          )}
                        </span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{commScore !== null ? commScore : '—'}</strong>
                          <span className="text-slate-400 text-xs">/20</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${commScore !== null ? (commScore / 20) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Pill Selection Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {COMM_STEPS.map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScore('comm', val)}
                            className={`px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              commScore === val
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card 4: Parliamentary Conduct (Max 12) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          Parliamentary Conduct
                          {conductScore !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unanswered</span>
                          )}
                        </span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{conductScore !== null ? conductScore : '—'}</strong>
                          <span className="text-slate-400 text-xs">/12</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${conductScore !== null ? (conductScore / 12) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Pill Selection Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {CONDUCT_STEPS.map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScore('conduct', val)}
                            className={`px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              conductScore === val
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card 5: Originality & Preparation (Max 12) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          Originality & Preparation
                          {originalityScore !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unanswered</span>
                          )}
                        </span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{originalityScore !== null ? originalityScore : '—'}</strong>
                          <span className="text-slate-400 text-xs">/12</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${originalityScore !== null ? (originalityScore / 12) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Pill Selection Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ORIGINALITY_STEPS.map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScore('originality', val)}
                            className={`px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              originalityScore === val
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card 6: Time Management (Max 6) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          Time Management
                          {timeScore !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selected</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Unanswered</span>
                          )}
                        </span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{timeScore !== null ? timeScore : '—'}</strong>
                          <span className="text-slate-400 text-xs">/6</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${timeScore !== null ? (timeScore / 6) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Pill Selection Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {TIME_STEPS.map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectScore('time', val)}
                            className={`px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              timeScore === val
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Lock Warning Banner */}
                  {isLocked && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        This score is locked and cannot be edited.
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLocked(false)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-400 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer"
                      >
                        Unlock
                      </button>
                    </div>
                  )}

                  {/* Qualitative Feedback Textarea */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Juror Remarks & Observations
                    </label>
                    <textarea
                      rows={3}
                      value={feedback}
                      disabled={isLocked}
                      onChange={e => handleFeedbackChange(e.target.value)}
                      placeholder="Enter specific commendations, points of order, or areas of development..."
                      className="input-theme w-full p-3 text-xs leading-relaxed"
                    />
                  </div>

                  {/* Evaluation Summary Card */}
                  <div className="rounded-xl border p-4 space-y-3 bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                          Evaluation Summary
                        </h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isEvaluationComplete
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {isEvaluationComplete ? 'READY TO SUBMIT' : `DRAFT — NOT SUBMITTED (${answeredCategoriesCount}/6)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Research & Constituency</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {researchScore !== null ? `${researchScore}/30` : <span className="text-amber-500 font-normal">Pending</span>}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Relevance to Central Agenda</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {relevanceScore !== null ? `${relevanceScore}/20` : <span className="text-amber-500 font-normal">Pending</span>}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Communication & Delivery</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {commScore !== null ? `${commScore}/20` : <span className="text-amber-500 font-normal">Pending</span>}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Parliamentary Conduct</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {conductScore !== null ? `${conductScore}/12` : <span className="text-amber-500 font-normal">Pending</span>}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Originality & Preparation</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {originalityScore !== null ? `${originalityScore}/12` : <span className="text-amber-500 font-normal">Pending</span>}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Time Management</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {timeScore !== null ? `${timeScore}/6` : <span className="text-amber-500 font-normal">Pending</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-500">TOTAL SCORE</span>
                        <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          {isEvaluationComplete ? `${totalScore} / 100` : `${totalScore} / 100 (Incomplete)`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {isEvaluationComplete ? 'Ready to Submit' : 'DRAFT — NOT SUBMITTED'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Submission Actions */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLocked(!isLocked)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isLocked
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <LockOpen className="w-3.5 h-3.5" />}
                        <span>{isLocked ? 'Score Locked' : 'Lock Score'}</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                      {draftSavedAt && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Draft saved locally at {draftSavedAt}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isLocked || answeredCategoriesCount === 0}
                        className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5 text-slate-500" />
                        <span>Save Draft</span>
                      </button>

                      {!isEvaluationComplete && (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 text-center">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Complete all 6 categories ({6 - answeredCategoriesCount} remaining to submit)
                        </span>
                      )}

                      {isSavedRecently && (
                        <span className="text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4" /> ✓ Official Evaluation Saved
                        </span>
                      )}

                      <button
                        type="submit"
                        disabled={isLocked || !isEvaluationComplete || isSubmittingEvaluation}
                        className="btn-primary w-full sm:w-auto px-6 py-2.5 min-h-[44px] text-xs font-bold shadow-md cursor-pointer hover:scale-102 transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>{isSubmittingEvaluation ? 'Submitting Official Evaluation...' : 'Submit Official Evaluation'}</span>
                      </button>
                    </div>
                  </div>

                </form>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <Sliders className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-semibold">Select a delegate from the roster or jump to a participant number to begin scoring.</p>
                </div>
              )}
            </div>

            {/* Right: Keypad Widget & Delegate Roster (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* "JUMP TO PARTICIPANT #" Keypad Card Widget (Hidden on mobile to eliminate duplicate keypad DOM) */}
              <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    JUMP TO PARTICIPANT #
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKeypadOpen(!isKeypadOpen)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title={isKeypadOpen ? 'Collapse Keypad' : 'Expand Keypad'}
                  >
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isKeypadOpen ? '' : 'rotate-180'}`} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 42"
                    value={jumpInput}
                    onChange={e => handleJumpInputChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white font-mono"
                  />
                  {jumpInput && (
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isKeypadOpen && (
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num)}
                        className="py-2.5 min-h-[44px] rounded-xl border border-amber-200/80 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-extrabold text-sm hover:bg-amber-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      title="Clear Input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Delegate Roster List */}
              <div
                className="rounded-2xl p-4 border flex flex-col h-[520px]"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <UserCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Delegate Roster ({filteredLearners.length})
                  </h2>
                </div>

                {/* Filter Controls */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search name, constituency number or constituency..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="input-theme pl-8 py-1.5 text-xs w-full"
                    />
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {(['ALL', 'Ruling', 'Opposition', 'Independent'] as const).map(b => (
                      <button
                        key={b}
                        onClick={() => setFilterBench(b)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer shrink-0 ${
                          filterBench === b ? 'border-current' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          background: filterBench === b ? 'var(--accent-soft)' : 'transparent',
                          color: filterBench === b ? 'var(--accent)' : 'var(--text-muted)',
                          borderColor: filterBench === b ? 'var(--accent)' : 'var(--border)'
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roster List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filteredLearners.length === 0 ? (
                    <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                      No delegates found matching filter.
                    </div>
                  ) : (
                    filteredLearners.map(learner => {
                      const isSelected = learner.id === selectedLearnerId;
                      const existingScore = currentSessionScoreMap.get(learner.id);
                      const constNum = learner.constituency_number ?? (learner as any).roll_no;
                      const constName = learner.constituency_name || learner.role || 'Assembly Seat';
                      const recogCount = learnerRecognitionsCountMap.get(learner.id) || 0;
                      const isCurrentlySpeaking = activeFloorSpeakingTurn?.learner_id === learner.id;

                      const isRecognized = recognizedLearnerIdsSet.has(learner.id);

                      return (
                        <div
                          key={learner.id}
                          className={`w-full p-2.5 rounded-xl border transition flex items-center justify-between gap-1.5 ${
                            isSelected ? 'shadow-sm scale-[1.01]' : 'hover:scale-[1.005]'
                          } ${isCurrentlySpeaking ? 'ring-2 ring-rose-500/50 bg-rose-500/5' : ''}`}
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-soft)' : (isCurrentlySpeaking ? 'rgba(244, 63, 94, 0.05)' : 'var(--bg-elevated)'),
                            borderColor: isCurrentlySpeaking ? 'rgb(244, 63, 94)' : (isSelected ? 'var(--accent)' : 'var(--border)')
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedLearnerId(learner.id)}
                            className="min-w-0 pr-1 flex-1 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                {learner.full_name}
                              </p>
                              {existingScore && (
                                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--emerald)' }} />
                              )}
                              {isCurrentlySpeaking && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs flex items-center gap-1 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  SPEAKING
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-bold truncate mt-0.5" style={{ color: 'var(--accent)' }}>
                              {constNum !== undefined && constNum !== null ? `#${constNum} • ` : ''}{constName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                                {learner.party_name || 'Independent'} • {learner.bench || 'Ruling'}
                              </span>
                              {recogCount > 0 && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/20 flex items-center gap-0.5">
                                  ⭐ {recogCount}
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {/* Small Star Recognition Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleLearnerRecognition(learner, e)}
                              aria-label={isRecognized ? `Remove recognition for ${learner.full_name}` : `Recognize ${learner.full_name}`}
                              title={isRecognized ? `Remove recognition for ${learner.full_name}` : `Recognize ${learner.full_name}`}
                              className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors cursor-pointer select-none ${
                                isRecognized
                                  ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                                  : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <span className="text-base font-bold leading-none" aria-hidden="true">
                                {isRecognized ? '★' : '☆'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedLearnerId(learner.id)}
                              className="text-right flex-shrink-0 flex flex-col items-end justify-center gap-1 cursor-pointer"
                            >
                              {constNum !== undefined && constNum !== null && (
                                <span
                                  className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded border"
                                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--accent)' }}
                                >
                                  #{constNum}
                                </span>
                              )}
                              {existingScore ? (
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  {existingScore.total}/100
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  Score Now
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (() => {
          const myEvaluations = storageService.getJuryEvaluations(
            event?.id,
            undefined,
            jury?.id || jury?.name
          );

          return (
            <div className="rounded-2xl p-6 border shadow-sm space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <History className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Completed Session Evaluations ({myEvaluations.length})
                </h2>
                <span className="text-xs text-slate-500">
                  Read-only audit record of your evaluations and speaking turn history
                </span>
              </div>

              {myEvaluations.length === 0 ? (
                <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No score records submitted by you yet. Select a delegate from the Evaluation tab to start scoring.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <tr>
                        <th className="py-2.5 px-3">Delegate</th>
                        <th className="py-2.5 px-3">Session</th>
                        <th className="py-2.5 px-3">Party & Bench</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3 text-center">Speaking Turns</th>
                        <th className="py-2.5 px-3 text-center">Adjustments</th>
                        <th className="py-2.5 px-3 text-right">Audit Trail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {myEvaluations.map(e => {
                        const turnsCount = Math.max(1, e.turns?.length || 1);
                        const adjsCount = e.adjustments?.length || 0;
                        return (
                          <tr key={e.id} className="hover:opacity-90">
                            <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                              <div>{e.learner_name}</div>
                              {e.constituency_number !== undefined && (
                                <span className="text-[10px] text-slate-400 font-mono">#{e.constituency_number} {e.constituency_name}</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {e.session_name || 'Session'}
                              </span>
                            </td>
                            <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                              {e.party_name} ({e.bench})
                            </td>
                            <td className="py-3 px-3 text-center font-black font-mono text-amber-500 text-sm">
                              {e.total}/100
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                {turnsCount} Turn{turnsCount > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {adjsCount > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  {adjsCount} Adjusted
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Unchanged</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setInspectingEvaluation(e)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
                              >
                                View Trail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* History Trail Modal */}
        {inspectingEvaluation && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl p-6 border shadow-2xl space-y-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" /> Evaluation History Trail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {inspectingEvaluation.learner_name} • {inspectingEvaluation.session_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingEvaluation(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Score Summary */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Official Score</span>
                  <span className="text-xl font-black font-mono text-amber-500">{inspectingEvaluation.total}/100</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{inspectingEvaluation.status}</span>
                </div>
              </div>

              {/* Chronological Trail */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Event Trail</h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs">
                    <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400 mb-1">
                      <span>Turn 1: Initial Evaluation</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(inspectingEvaluation.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Research: {inspectingEvaluation.research_constituency}</span>
                      <span>Agenda: {inspectingEvaluation.relevance_agenda}</span>
                      <span>Delivery: {inspectingEvaluation.communication_delivery}</span>
                      <span>Conduct: {inspectingEvaluation.parliamentary_conduct}</span>
                      <span>Orig: {inspectingEvaluation.originality_preparation}</span>
                      <span>Time: {inspectingEvaluation.time_management}</span>
                    </div>
                  </div>

                  {inspectingEvaluation.turns?.filter(t => t.action_type !== 'INITIAL_EVALUATION').map(t => (
                    <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-1">
                        <span>Turn {t.turn_number}: {t.action_type.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-[10px] text-slate-400">{new Date(t.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-500 italic">{t.notes || 'Participation contribution recorded.'}</p>
                    </div>
                  ))}

                  {inspectingEvaluation.adjustments?.map((adj, idx) => (
                    <div key={adj.id || idx} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-600 dark:text-amber-400">
                        <span>Score Adjustment ({adj.delta_total >= 0 ? `+${adj.delta_total}` : adj.delta_total})</span>
                        <span className="font-mono text-[10px] text-slate-400">{new Date(adj.adjusted_at).toLocaleString()}</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        Total changed: {adj.previous_total} → {adj.new_total}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 italic">
                        Reason: "{adj.adjustment_reason}"
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Recorded by: {adj.juror_name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectingEvaluation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agenda Tab */}
        {activeTab === 'agenda' && (
          <div className="rounded-2xl p-6 border space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Assembly Floor Agenda
            </h2>
            <div className="space-y-3">
              {liveAgenda.length === 0 ? (
                <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No agenda items scheduled yet.
                </div>
              ) : (
                liveAgenda.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border flex items-start justify-between gap-4"
                    style={{
                      backgroundColor: item.is_current ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                      borderColor: item.is_current ? 'var(--accent)' : 'var(--border)'
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                          {item.time}
                        </span>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                        {item.is_current && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: 'var(--emerald)', color: '#fff' }}>
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {item.description}
                      </p>
                    </div>
                    {item.speaker_role && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {item.speaker_role}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Turn Evaluation Adjustment Modal */}
        {isAdjustmentModalOpen && currentEvaluation && selectedLearner && (() => {
          const adjTotal = adjResearch + adjRelevance + adjComm + adjConduct + adjOriginality + adjTime;
          const delta = adjTotal - currentEvaluation.total;
          return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-2xl p-6 border shadow-2xl space-y-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-amber-500" /> Adjust Evaluation — Turn {currentTurnNumber}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedLearner.full_name} • {selectedSession.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAdjustmentModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Score Comparison Widget */}
                <div className="flex items-center justify-around p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Previous Score</span>
                    <span className="text-xl font-black font-mono text-slate-600 dark:text-slate-300">{currentEvaluation.total}</span>
                  </div>
                  <span className="text-slate-400 font-bold text-lg">→</span>
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">New Score</span>
                    <span className="text-xl font-black font-mono text-amber-500">{adjTotal}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Net Delta</span>
                    <span className={`text-xl font-black font-mono ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {delta >= 0 ? `+${delta}` : delta}
                    </span>
                  </div>
                </div>

                {/* 6 Category Sliders/Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Research (0..30) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Research & Constituency</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-black">{adjResearch}/30</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {RESEARCH_STEPS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAdjResearch(v)}
                          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            adjResearch === v ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Relevance (0..20) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Relevance to Agenda</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-black">{adjRelevance}/20</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {RELEVANCE_STEPS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAdjRelevance(v)}
                          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            adjRelevance === v ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery (0..20) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Communication & Delivery</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{adjComm}/20</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {COMM_STEPS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAdjComm(v)}
                          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            adjComm === v ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parliamentary Conduct (0..12) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Parliamentary Conduct</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-black">{adjConduct}/12</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {CONDUCT_STEPS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAdjConduct(v)}
                          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            adjConduct === v ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Originality & Prep (0..12) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Originality & Preparation</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{adjOriginality}/12</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ORIGINALITY_STEPS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAdjOriginality(v)}
                          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            adjOriginality === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Management (0..6) */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Time Management</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-black">{adjTime}/6</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {TIME_STEPS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAdjTime(v)}
                          className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            adjTime === v ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mandatory Adjustment Reason */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Adjustment Reason <span className="text-rose-500">* (Mandatory for audit trail)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={adjustmentReason}
                    onChange={e => setAdjustmentReason(e.target.value)}
                    placeholder="e.g. Clearer rebuttal and stronger delivery during Turn 2."
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                  {adjustmentReason.trim().length === 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      Please enter a justification explaining why the score was adjusted for this speaking turn.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAdjustmentModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!adjustmentReason.trim()}
                    onClick={handleSaveAdjustment}
                    className="btn-primary px-5 py-2 text-xs font-bold shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Score Adjustment
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ONE-TIME LIVE MODE SUBMISSION WARNING MODAL (PHASE 19) */}
        {isLiveWarningModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div
              className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    OFFICIAL JURY SUBMISSION
                  </h4>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Live Production Mode Active
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  You are about to create an official jury evaluation.
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  This score will be entered into the authoritative event ledger for <strong>{selectedLearner?.full_name}</strong> in session <strong>{selectedSession.name}</strong> and cannot be silently undone.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  (If you are practicing or testing, switch to Test Mode in the Coordinator panel first.)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsLiveWarningModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-semibold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveWarningModalOpen(false);
                    setHasAcknowledgedLiveWarning(true);
                    executeActualSubmission();
                  }}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer transition"
                >
                  Continue & Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
