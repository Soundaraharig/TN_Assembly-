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
  ChevronRight
} from 'lucide-react';
import type { JuryMember, Learner, ScoreRecord, CollegeEvent, AgendaItem } from '../../types';
import { useTheme } from '../../lib/theme';

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

  // Jump to Participant Keypad State
  const [jumpInput, setJumpInput] = useState<string>('');
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(true);

  // Set default selected learner
  useEffect(() => {
    if (learners.length > 0 && !selectedLearnerId) {
      setSelectedLearnerId(learners[0].id);
    }
  }, [learners, selectedLearnerId]);

  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  const [loadedLearnerId, setLoadedLearnerId] = useState<string>('');

  // Load existing score ONLY when learner changes or initial load
  useEffect(() => {
    if (!selectedLearner) return;
    if (loadedLearnerId === selectedLearner.id) return;

    const existing = scores.find(s => s.learner_id === selectedLearner.id && (!event || s.event_id === event.id));
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
    setLoadedLearnerId(selectedLearner.id);
  }, [selectedLearner, loadedLearnerId, scores, event]);

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

    const existing = scores.find(s => s.learner_id === selectedLearner.id && (!event || s.event_id === event.id));
    const record: ScoreRecord = {
      id: existing?.id || `score_${selectedLearner.id}_${Date.now()}`,
      event_id: event?.id || selectedLearner.event_id || '',
      learner_id: selectedLearner.id,
      learner_name: selectedLearner.full_name,
      party_name: selectedLearner.party_name || 'Independent',
      bench: selectedLearner.bench || 'Ruling',
      
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
    if (!query.trim()) return;

    const num = parseInt(query.trim(), 10);
    const matched = learners.find(l =>
      (num > 0 && l.constituency_number === num) ||
      (l.constituency_number !== undefined && l.constituency_number.toString() === query.trim()) ||
      l.access_code.toUpperCase() === query.trim().toUpperCase()
    );
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

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    persistScoreRecord();
    if (selectedLearner) {
      onShowToast('Evaluation Saved', `Recorded score of ${totalScore}/100 for ${selectedLearner.full_name}`, 'success');
    }
  };

  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      const matchesSearch =
        l.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.party_name && l.party_name.toLowerCase().includes(search.toLowerCase())) ||
        (l.constituency_name && l.constituency_name.toLowerCase().includes(search.toLowerCase())) ||
        (l.constituency_number !== undefined && l.constituency_number.toString().includes(search));

      const matchesBench = filterBench === 'ALL' || l.bench === filterBench;
      return matchesSearch && matchesBench;
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
                {event?.college_name || 'Tamil Nadu Youth Assembly'}
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
              <History className="w-3.5 h-3.5" /> Score History ({scores.length})
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
        {activeTab === 'evaluate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Middle: Rubric Evaluation Form (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {selectedLearner ? (
                <form onSubmit={handleSaveEvaluation} className="rounded-2xl p-6 border space-y-6 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  
                  {/* Delegate Header Info & Stepper */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                          {selectedLearner.full_name}
                        </h2>
                        {selectedLearner.constituency_number !== undefined && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            #{selectedLearner.constituency_number}
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
                        Party: <strong style={{ color: 'var(--text-secondary)' }}>{selectedLearner.party_name || 'Independent'}</strong> • Constituency:{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>{selectedLearner.constituency_name || selectedLearner.role || 'Floor Delegate'}</strong>
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
                        <Save className="w-4 h-4" /> Save Evaluation
                      </button>
                    </div>
                  </div>

                </form>
              ) : (
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
                      placeholder="Search name, constituency..."
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
                      const existingScore = scores.find(s => s.learner_id === learner.id && (!event || s.event_id === event.id));

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
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                {learner.full_name}
                              </p>
                              {existingScore && (
                                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--emerald)' }} />
                              )}
                            </div>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {learner.party_name || 'Independent'} • {learner.constituency_name || learner.role || 'MLA'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--accent)' }}
                            >
                              {learner.constituency_number !== undefined ? `#${learner.constituency_number}` : learner.bench || 'MLA'}
                            </span>
                            {existingScore && (
                              <p className="text-[10px] font-black mt-1" style={{ color: 'var(--amber)' }}>
                                {existingScore.total}/100
                              </p>
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
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-base font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <History className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Completed Evaluations ({scores.length})
            </h2>
            {scores.length === 0 ? (
              <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                No score records submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <tr>
                      <th className="py-2.5 px-3">Delegate</th>
                      <th className="py-2.5 px-3">Party & Bench</th>
                      <th className="py-2.5 px-3 text-center">Research (30)</th>
                      <th className="py-2.5 px-3 text-center">Agenda (20)</th>
                      <th className="py-2.5 px-3 text-center">Comm. (20)</th>
                      <th className="py-2.5 px-3 text-center">Conduct (12)</th>
                      <th className="py-2.5 px-3 text-center">Orig. (12)</th>
                      <th className="py-2.5 px-3 text-center">Time (6)</th>
                      <th className="py-2.5 px-3 text-center font-bold">Total (100)</th>
                      <th className="py-2.5 px-3">Juror Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {scores.map(s => (
                      <tr key={s.id} className="hover:opacity-80">
                        <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                          {s.learner_name}
                        </td>
                        <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {s.party_name} ({s.bench})
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{s.research_constituency ?? s.policy_knowledge ?? '-'}</td>
                        <td className="py-3 px-3 text-center font-mono">{s.relevance_agenda ?? s.rebuttal_debate ?? '-'}</td>
                        <td className="py-3 px-3 text-center font-mono">{s.communication_delivery ?? s.oratory ?? '-'}</td>
                        <td className="py-3 px-3 text-center font-mono">{s.parliamentary_conduct}</td>
                        <td className="py-3 px-3 text-center font-mono">{s.originality_preparation ?? '-'}</td>
                        <td className="py-3 px-3 text-center font-mono">{s.time_management ?? '-'}</td>
                        <td className="py-3 px-3 text-center font-mono font-black" style={{ color: 'var(--amber)' }}>
                          {s.total}
                        </td>
                        <td className="py-3 px-3 italic" style={{ color: 'var(--text-muted)' }}>
                          {s.feedback || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Agenda Tab */}
        {activeTab === 'agenda' && (
          <div className="rounded-2xl p-6 border space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Assembly Floor Agenda
            </h2>
            <div className="space-y-3">
              {agenda.length === 0 ? (
                <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No agenda items scheduled yet.
                </div>
              ) : (
                agenda.map(item => (
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
      </main>
    </div>
  );
};
