import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import type { JuryMember, Learner, ScoreRecord, CollegeEvent, AgendaItem, ScoringSession, JuryEvaluation } from '../../types';
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
  learners,
  agenda,
  scores,
  onSaveScore,
  onLogout,
  onShowToast
}) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterBench, setFilterBench] = useState<'ALL' | 'Ruling' | 'Opposition' | 'Independent'>('ALL');
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history' | 'agenda'>('evaluate');

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

  const handleSessionChange = (newSessionId: string) => {
    setSelectedSessionId(newSessionId);
    setLoadedKey(''); // Force reload for current delegate under new session
  };

  // 6 Rubric Scores State
  const [researchScore, setResearchScore] = useState<number>(2);
  const [relevanceScore, setRelevanceScore] = useState<number>(2);
  const [commScore, setCommScore] = useState<number>(2);
  const [conductScore, setConductScore] = useState<number>(1);
  const [originalityScore, setOriginalityScore] = useState<number>(1);
  const [timeScore, setTimeScore] = useState<number>(1);

  const [feedback, setFeedback] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

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
      selectedLearner.id
    );
    return evals[0] || null;
  }, [event?.id, selectedSession, jury?.id, jury?.name, selectedLearner?.id, scores]);

  // Speaking turns for this delegate in the current canonical session
  const delegateSpeakingTurns = useMemo(() => {
    if (!event?.id || !selectedLearner) return [];
    const agendaItems = storageService.getAgenda(event.id);
    const resolved = resolveCanonicalSession(selectedSession.id, selectedSession.name, agendaItems);
    return storageService.getSpeakingTurns(event.id).filter(t => {
      const turnResolved = resolveCanonicalSession(t.session_id, t.session_name, agendaItems);
      return turnResolved.canonicalId === resolved.canonicalId &&
             t.learner_id === selectedLearner.id &&
             t.status !== 'CANCELLED';
    });
  }, [event?.id, selectedSession, selectedLearner?.id]);

  const currentTurnNumber = useMemo(() => {
    if (!currentEvaluation) return 1;
    const turnsRecorded = currentEvaluation.turns?.length || 0;
    return Math.max(2, turnsRecorded + 1, delegateSpeakingTurns.length);
  }, [currentEvaluation, delegateSpeakingTurns.length]);

  const [loadedKey, setLoadedKey] = useState<string>('');

  // Load existing score when selected learner OR selected session changes
  useEffect(() => {
    if (!selectedLearnerId || !selectedSession) return;
    const currentKey = `${selectedLearnerId}:::${selectedSession.id}`;
    if (loadedKey === currentKey) return;

    const existing = scores.find(s =>
      s.learner_id === selectedLearnerId &&
      (!event || !s.event_id || s.event_id === event.id) &&
      (s.session_id === selectedSession.id || s.session_name === selectedSession.name) &&
      ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))
    );
    if (existing) {
      setResearchScore(existing.research_constituency ?? existing.policy_knowledge ?? 2);
      setRelevanceScore(existing.relevance_agenda ?? existing.rebuttal_debate ?? 2);
      setCommScore(existing.communication_delivery ?? existing.oratory ?? 2);
      setConductScore(existing.parliamentary_conduct ?? 1);
      setOriginalityScore(existing.originality_preparation ?? 1);
      setTimeScore(existing.time_management ?? 1);
      setIsLocked(existing.is_locked ?? false);
      setFeedback(existing.feedback || '');
    } else {
      // Default baseline values (matching 2 + 2 + 2 + 1 + 1 + 1 = 9 total baseline)
      setResearchScore(2);
      setRelevanceScore(2);
      setCommScore(2);
      setConductScore(1);
      setOriginalityScore(1);
      setTimeScore(1);
      setIsLocked(false);
      setFeedback('');
    }
    setLoadedKey(currentKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLearnerId, selectedSession.id, scores]);

  const totalScore = researchScore + relevanceScore + commScore + conductScore + originalityScore + timeScore;

  // Persist score record immediately to storage & Supabase
  const persistScoreRecord = (overrides?: {
    research?: number;
    relevance?: number;
    comm?: number;
    conduct?: number;
    originality?: number;
    time?: number;
    feedbackStr?: string;
    lockedBool?: boolean;
  }) => {
    if (!selectedLearner) return;

    const rScore = overrides?.research ?? researchScore;
    const relScore = overrides?.relevance ?? relevanceScore;
    const cScore = overrides?.comm ?? commScore;
    const condScore = overrides?.conduct ?? conductScore;
    const origScore = overrides?.originality ?? originalityScore;
    const tScore = overrides?.time ?? timeScore;
    const fb = overrides?.feedbackStr !== undefined ? overrides.feedbackStr : feedback;
    const lk = overrides?.lockedBool !== undefined ? overrides.lockedBool : isLocked;

    const currentTotal = rScore + relScore + cScore + condScore + origScore + tScore;

    const existing = scores.find(s =>
      s.learner_id === selectedLearner.id &&
      (!event || !s.event_id || s.event_id === event.id) &&
      (s.session_id === selectedSession.id || s.session_name === selectedSession.name) &&
      ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))
    );
    const record: ScoreRecord = {
      id: existing?.id || `score_${selectedLearner.id}_${selectedSession.id}_${jury?.id || 'jury'}_${Date.now()}`,
      event_id: event?.id || selectedLearner.event_id || '',
      session_id: selectedSession.id,
      session_name: selectedSession.name,
      learner_id: selectedLearner.id,
      learner_name: selectedLearner.full_name,
      constituency_number: selectedLearner.constituency_number,
      constituency_name: selectedLearner.constituency_name,
      party_name: selectedLearner.party_name || 'Independent',
      bench: selectedLearner.bench || 'Ruling',
      jury_id: jury?.id,
      
      // 6 Rubric Breakdown (Exact 100 Total)
      research_constituency: rScore,
      relevance_agenda: relScore,
      communication_delivery: cScore,
      parliamentary_conduct: condScore,
      originality_preparation: origScore,
      time_management: tScore,

      // Legacy fallback fields for backwards compatibility
      oratory: cScore,
      policy_knowledge: rScore,
      rebuttal_debate: relScore,

      total: currentTotal,
      feedback: fb.trim(),
      juror_name: jury?.name || 'Evaluator',
      is_locked: lk,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSaveScore(record);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleSelectScore = (type: 'research' | 'relevance' | 'comm' | 'conduct' | 'originality' | 'time', val: number) => {
    if (isLocked) return;
    if (type === 'research') {
      setResearchScore(val);
      persistScoreRecord({ research: val });
    } else if (type === 'relevance') {
      setRelevanceScore(val);
      persistScoreRecord({ relevance: val });
    } else if (type === 'comm') {
      setCommScore(val);
      persistScoreRecord({ comm: val });
    } else if (type === 'conduct') {
      setConductScore(val);
      persistScoreRecord({ conduct: val });
    } else if (type === 'originality') {
      setOriginalityScore(val);
      persistScoreRecord({ originality: val });
    } else if (type === 'time') {
      setTimeScore(val);
      persistScoreRecord({ time: val });
    }
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

  const handleRecordContributionOnly = () => {
    if (!currentEvaluation || !selectedLearner || !event?.id) return;
    const activeTurn = delegateSpeakingTurns.find(t => t.status === 'SPEAKING' || t.status === 'SPOKEN') || delegateSpeakingTurns[delegateSpeakingTurns.length - 1];
    const turnId = activeTurn?.id || `turn_contrib_${selectedLearner.id}_${Date.now()}`;
    
    storageService.recordContributionOnly({
      evaluationId: currentEvaluation.id,
      speakingTurnId: turnId,
      jurorId: jury?.id || jury?.name || 'jury',
      jurorName: jury?.name || 'Evaluator',
      notes: `Recorded participation on Turn ${currentTurnNumber}. Score preserved at ${currentEvaluation.total}/100.`
    });

    onShowToast('Turn Contribution Logged', `Recorded speaking turn contribution for ${selectedLearner.full_name}. Official score preserved at ${currentEvaluation.total}/100.`, 'success');
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

    const activeTurn = delegateSpeakingTurns.find(t => t.status === 'SPEAKING' || t.status === 'SPOKEN') || delegateSpeakingTurns[delegateSpeakingTurns.length - 1];
    const turnId = activeTurn?.id || `turn_adj_${selectedLearner.id}_${Date.now()}`;

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
    if (!selectedLearner || !event?.id) return;
    const activeTurn = delegateSpeakingTurns.find(t => t.status === 'SPEAKING' || t.status === 'SPOKEN') || delegateSpeakingTurns[0];
    const turnId = activeTurn?.id || `turn_init_${selectedLearner.id}_${Date.now()}`;

    storageService.recordInitialEvaluation({
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
      research_constituency: researchScore,
      relevance_agenda: relevanceScore,
      communication_delivery: commScore,
      parliamentary_conduct: conductScore,
      originality_preparation: originalityScore,
      time_management: timeScore,
      speakingTurnId: turnId,
      feedback: feedback
    });

    persistScoreRecord();
    onShowToast('Initial Evaluation Saved', `Recorded Turn 1 evaluation (${totalScore}/100) for ${selectedLearner.full_name}`, 'success');
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
        className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm"
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
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border transition flex items-center gap-1 cursor-pointer ${
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
                        className="text-[10px] font-bold text-rose-500 hover:underline"
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
                        className="py-2.5 rounded-xl border border-amber-200/80 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-extrabold text-sm hover:bg-amber-100 dark:hover:bg-slate-600 active:scale-95 transition cursor-pointer shadow-2xs"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileKeypadOpen(false)}
                      className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-emerald-500 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
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
                      className="text-amber-500 hover:underline cursor-pointer"
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
                      const existingScore = scores.find(s =>
                        s.learner_id === learner.id &&
                        (!event || !s.event_id || s.event_id === event.id) &&
                        (s.session_id === selectedSession.id || s.session_name === selectedSession.name) &&
                        ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))
                      );
                      const constNum = learner.constituency_number ?? (learner as any).roll_no;
                      const constName = learner.constituency_name || learner.role || 'Assembly Seat';

                      return (
                        <button
                          key={learner.id}
                          type="button"
                          onClick={() => {
                            setSelectedLearnerId(learner.id);
                            setIsMobileSearchOpen(false);
                            setSearch('');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2 flex-1">
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
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end justify-center gap-1">
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
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Bench filter pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Bench:
                </span>
                {(['ALL', 'Ruling', 'Opposition', 'Independent'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFilterBench(b)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer shrink-0 ${
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
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
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
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
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
              {selectedLearner ? (
                currentEvaluation ? (
                  <div className="rounded-2xl p-6 border space-y-6 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
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

                    {/* ACTIONS: RECORD CONTRIBUTION ONLY vs ADJUST EVALUATION */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Subsequent Speaking Opportunity (Turn {currentTurnNumber})
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          The delegate already has an official session evaluation. Choose an action for this turn:
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleRecordContributionOnly}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Record Contribution Only (Keep {currentEvaluation.total}/100)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenAdjustmentModal}
                          className="btn-primary px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer hover:scale-102 transition-transform flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Adjust Evaluation (Turn {currentTurnNumber})</span>
                        </button>
                      </div>
                    </div>

                    {/* Turn History / Audit Trail */}
                    {Boolean(currentEvaluation.turns?.length || currentEvaluation.adjustments?.length) && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" /> Turn History & Audit Trail
                        </h4>
                        <div className="space-y-2">
                          {currentEvaluation.turns?.map((t, idx) => (
                            <div key={t.id || idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white mr-2">Turn {t.turn_number}:</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mr-2">
                                  {t.action_type.replace(/_/g, ' ')}
                                </span>
                                {t.notes && <span className="text-slate-500 italic">"{t.notes}"</span>}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                          {currentEvaluation.adjustments?.map((a, idx) => (
                            <div key={a.id || idx} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-amber-600 dark:text-amber-400 mr-2">Score Adjustment:</span>
                                <span className="font-mono font-bold mr-2">{a.previous_total} → {a.new_total} ({a.delta_total >= 0 ? `+${a.delta_total}` : a.delta_total})</span>
                                <span className="text-slate-600 dark:text-slate-300 italic">"{a.adjustment_reason}"</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(a.adjusted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                <form onSubmit={handleSaveEvaluation} className="rounded-2xl p-6 border space-y-6 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  
                  {/* Delegate Header Info & Stepper */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div>
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

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Total Score
                        </p>
                        <p className="text-2xl font-black" style={{ color: 'var(--amber)' }}>
                          {totalScore} <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>/ 100</span>
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: grade.color }}>
                          {grade.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6 Rubric Criteria Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Card 1: Research & Constituency Understanding (Max 30) */}
                    <div className="p-4 rounded-xl border space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <span>Research & Constituency Understanding</span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{researchScore}</strong>
                          <span className="text-slate-400 text-xs">/30</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(researchScore / 30) * 100}%` }}
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        <span>Relevance to Central Agenda</span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{relevanceScore}</strong>
                          <span className="text-slate-400 text-xs">/20</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(relevanceScore / 20) * 100}%` }}
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        <span>Communication & Delivery</span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{commScore}</strong>
                          <span className="text-slate-400 text-xs">/20</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(commScore / 20) * 100}%` }}
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        <span>Parliamentary Conduct</span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{conductScore}</strong>
                          <span className="text-slate-400 text-xs">/12</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(conductScore / 12) * 100}%` }}
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        <span>Originality & Preparation</span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{originalityScore}</strong>
                          <span className="text-slate-400 text-xs">/12</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(originalityScore / 12) * 100}%` }}
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        <span>Time Management</span>
                        <span className="font-mono text-sm">
                          <strong className="text-blue-600 dark:text-blue-400">{timeScore}</strong>
                          <span className="text-slate-400 text-xs">/6</span>
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(timeScore / 6) * 100}%` }}
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Enter specific commendations, points of order, or areas of development..."
                      className="input-theme w-full p-3 text-xs leading-relaxed"
                    />
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

                    <div className="flex items-center gap-3">
                      {isSavedRecently && (
                        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--emerald)' }}>
                          <CheckCircle className="w-4 h-4" /> Score Saved!
                        </span>
                      )}

                      <button
                        type="submit"
                        disabled={isLocked}
                        className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer hover:scale-102 transition-transform disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Save Initial Evaluation (Turn 1)
                      </button>
                    </div>
                  </div>

                </form>
              ) ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <Sliders className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-semibold">Select a delegate from the roster or jump to a participant number to begin scoring.</p>
                </div>
              )}
            </div>

            {/* Right: Keypad Widget & Delegate Roster (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* "JUMP TO PARTICIPANT #" Keypad Card Widget */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    JUMP TO PARTICIPANT #
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKeypadOpen(!isKeypadOpen)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                        className="py-2.5 rounded-xl border border-amber-200/80 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-extrabold text-sm hover:bg-amber-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
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
                      const existingScore = scores.find(s =>
                        s.learner_id === learner.id &&
                        (!event || !s.event_id || s.event_id === event.id) &&
                        (s.session_id === selectedSession.id || s.session_name === selectedSession.name) &&
                        ((jury?.id && s.jury_id === jury.id) || (jury?.name && s.juror_name === jury.name))
                      );
                      const constNum = learner.constituency_number ?? (learner as any).roll_no;
                      const constName = learner.constituency_name || learner.role || 'Assembly Seat';

                      return (
                        <button
                          key={learner.id}
                          onClick={() => setSelectedLearnerId(learner.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'shadow-sm scale-[1.01]' : 'hover:scale-[1.005]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)'
                          }}
                        >
                          <div className="min-w-0 pr-2 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                {learner.full_name}
                              </p>
                              {existingScore && (
                                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--emerald)' }} />
                              )}
                            </div>
                            <p className="text-[11px] font-bold truncate mt-0.5" style={{ color: 'var(--accent)' }}>
                              {constNum !== undefined && constNum !== null ? `#${constNum} • ` : ''}{constName}
                            </p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {learner.party_name || 'Independent'} • {learner.bench || 'Ruling'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end justify-center gap-1">
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
                          </div>
                        </button>
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
      </main>
    </div>
  );
};
