import React, { useState, useEffect } from 'react';
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
  Moon
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

  // Rubric Scores (0 - 25 each, Total = 100)
  const [oratory, setOratory] = useState<number>(20);
  const [policyKnowledge, setPolicyKnowledge] = useState<number>(20);
  const [parliamentaryConduct, setParliamentaryConduct] = useState<number>(20);
  const [rebuttalDebate, setRebuttalDebate] = useState<number>(20);
  const [feedback, setFeedback] = useState<string>('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Set default selected learner
  useEffect(() => {
    if (learners.length > 0 && !selectedLearnerId) {
      setSelectedLearnerId(learners[0].id);
    }
  }, [learners, selectedLearnerId]);

  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  // Load existing score when learner changes
  useEffect(() => {
    if (!selectedLearner) return;
    const existing = scores.find(s => s.learner_id === selectedLearner.id && (!event || s.event_id === event.id));
    if (existing) {
      setOratory(existing.oratory);
      setPolicyKnowledge(existing.policy_knowledge);
      setParliamentaryConduct(existing.parliamentary_conduct);
      setRebuttalDebate(existing.rebuttal_debate);
      setFeedback(existing.feedback || '');
    } else {
      // Default baseline values
      setOratory(20);
      setPolicyKnowledge(20);
      setParliamentaryConduct(20);
      setRebuttalDebate(20);
      setFeedback('');
    }
  }, [selectedLearnerId, scores, event]);

  const totalScore = oratory + policyKnowledge + parliamentaryConduct + rebuttalDebate;

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner) return;

    const record: ScoreRecord = {
      id: `score_${selectedLearner.id}_${Date.now()}`,
      event_id: event?.id || selectedLearner.event_id || '',
      learner_id: selectedLearner.id,
      learner_name: selectedLearner.full_name,
      party_name: selectedLearner.party_name || 'Independent',
      bench: selectedLearner.bench || 'Ruling',
      oratory,
      policy_knowledge: policyKnowledge,
      parliamentary_conduct: parliamentaryConduct,
      rebuttal_debate: rebuttalDebate,
      total: totalScore,
      feedback: feedback.trim(),
      juror_name: jury?.name || 'Evaluator',
      updated_at: new Date().toISOString()
    };

    onSaveScore(record);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
    onShowToast('Evaluation Submitted', `Recorded score of ${totalScore}/100 for ${selectedLearner.full_name}`, 'success');
  };

  const filteredLearners = learners.filter(l => {
    const matchesSearch =
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.party_name && l.party_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.constituency_name && l.constituency_name.toLowerCase().includes(search.toLowerCase())) ||
      l.access_code.toLowerCase().includes(search.toLowerCase());

    const matchesBench = filterBench === 'ALL' || l.bench === filterBench;
    return matchesSearch && matchesBench;
  });

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
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'evaluate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Delegate Selector (4 cols) */}
            <div
              className="lg:col-span-4 rounded-2xl p-4 border flex flex-col h-[700px]"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <UserCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Delegate Roster
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {filteredLearners.length} Delegates
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search name, code, party..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-theme pl-8 py-2 text-xs w-full"
                />
              </div>

              {/* Bench Filter Pills */}
              <div className="flex gap-1 mb-3">
                {(['ALL', 'Ruling', 'Opposition', 'Independent'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setFilterBench(b)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition ${
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

              {/* Delegates Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredLearners.length === 0 ? (
                  <div className="text-center py-16 text-xs" style={{ color: 'var(--text-muted)' }}>
                    No delegates found.
                  </div>
                ) : (
                  filteredLearners.map(learner => {
                    const isSelected = selectedLearnerId === learner.id;
                    const existingScore = scores.find(s => s.learner_id === learner.id);
                    return (
                      <button
                        key={learner.id}
                        onClick={() => setSelectedLearnerId(learner.id)}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                          isSelected ? 'shadow-md scale-[1.01]' : 'hover:scale-[1.005]'
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

            {/* Right: Rubric Evaluation Form (8 cols) */}
            <div
              className="lg:col-span-8 rounded-2xl p-6 border flex flex-col"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              {selectedLearner ? (
                <form onSubmit={handleSaveEvaluation} className="space-y-6">
                  {/* Delegate Header Info */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                          {selectedLearner.full_name}
                        </h2>
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
                        Party: <strong style={{ color: 'var(--text-secondary)' }}>{selectedLearner.party_name || 'Independent'}</strong> • Committee:{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>{selectedLearner.committee_name || 'Assembly Floor'}</strong>
                      </p>
                    </div>

                    {/* Aggregate Score Indicator */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Total Evaluation
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

                  {/* 4 Standard Rubric Sliders (0 - 25 each) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rubric 1 */}
                    <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span style={{ color: 'var(--text-primary)' }}>1. Oratory & Rhetoric</span>
                        <span className="font-mono text-sm font-black" style={{ color: 'var(--accent)' }}>
                          {oratory} / 25
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={oratory}
                        onChange={e => setOratory(Number(e.target.value))}
                        className="w-full h-2 rounded cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>Clarity & Delivery</span>
                        <span>Max 25 pts</span>
                      </div>
                    </div>

                    {/* Rubric 2 */}
                    <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span style={{ color: 'var(--text-primary)' }}>2. Policy Knowledge & Research</span>
                        <span className="font-mono text-sm font-black" style={{ color: 'var(--accent)' }}>
                          {policyKnowledge} / 25
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={policyKnowledge}
                        onChange={e => setPolicyKnowledge(Number(e.target.value))}
                        className="w-full h-2 rounded cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>Constituency Data & Acts</span>
                        <span>Max 25 pts</span>
                      </div>
                    </div>

                    {/* Rubric 3 */}
                    <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span style={{ color: 'var(--text-primary)' }}>3. Parliamentary Conduct</span>
                        <span className="font-mono text-sm font-black" style={{ color: 'var(--accent)' }}>
                          {parliamentaryConduct} / 25
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={parliamentaryConduct}
                        onChange={e => setParliamentaryConduct(Number(e.target.value))}
                        className="w-full h-2 rounded cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>Decorum & Speaker Respect</span>
                        <span>Max 25 pts</span>
                      </div>
                    </div>

                    {/* Rubric 4 */}
                    <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span style={{ color: 'var(--text-primary)' }}>4. Counter-Argument & Rebuttal</span>
                        <span className="font-mono text-sm font-black" style={{ color: 'var(--accent)' }}>
                          {rebuttalDebate} / 25
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={rebuttalDebate}
                        onChange={e => setRebuttalDebate(Number(e.target.value))}
                        className="w-full h-2 rounded cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>Question Hour Defense</span>
                        <span>Max 25 pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Qualitative Feedback Textarea */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Juror Remarks & Citations
                    </label>
                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Enter specific commendations, Hansard points of order, or areas of development..."
                      className="input-theme w-full p-3 text-xs leading-relaxed"
                    />
                  </div>

                  {/* Form Submission Action */}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    {isSavedRecently ? (
                      <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--emerald)' }}>
                        <CheckCircle className="w-4 h-4" /> Score saved & synchronized!
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Scores sync in real-time to the Central Coordinator Score Grid.
                      </span>
                    )}

                    <button
                      type="submit"
                      className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer hover:scale-102 transition-transform"
                    >
                      <Save className="w-4 h-4" /> Submit Evaluation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12" style={{ color: 'var(--text-muted)' }}>
                  <Sliders className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-semibold">Select a delegate from the left roster to begin scoring.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-base font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <History className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Completed Evaluations
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
                      <th className="py-2.5 px-3 text-center">Oratory (25)</th>
                      <th className="py-2.5 px-3 text-center">Policy (25)</th>
                      <th className="py-2.5 px-3 text-center">Conduct (25)</th>
                      <th className="py-2.5 px-3 text-center">Rebuttal (25)</th>
                      <th className="py-2.5 px-3 text-center">Total (100)</th>
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
                        <td className="py-3 px-3 text-center">{s.oratory}</td>
                        <td className="py-3 px-3 text-center">{s.policy_knowledge}</td>
                        <td className="py-3 px-3 text-center">{s.parliamentary_conduct}</td>
                        <td className="py-3 px-3 text-center">{s.rebuttal_debate}</td>
                        <td className="py-3 px-3 text-center font-black" style={{ color: 'var(--amber)' }}>
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
          <div className="rounded-2xl p-6 border space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
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
