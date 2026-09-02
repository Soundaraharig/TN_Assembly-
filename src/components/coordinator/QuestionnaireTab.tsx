import React, { useState } from 'react';
import type { ParliamentQuestion, Learner } from '../../types';
import {
  HelpCircle,
  Plus,
  MessageSquare
} from 'lucide-react';

interface QuestionnaireTabProps {
  questions: ParliamentQuestion[];
  learners: Learner[];
  eventId: string;
  onAddQuestion: (q: Partial<ParliamentQuestion>) => void;
  onAnswerQuestion: (id: string, response: string) => void;
  onUpdateStatus?: (id: string, status: ParliamentQuestion['status']) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuestionnaireTab: React.FC<QuestionnaireTabProps> = ({
  questions,
  learners,
  eventId,
  onAddQuestion,
  onAnswerQuestion,
  onShowToast
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Form State
  const [qType, setQType] = useState<ParliamentQuestion['type']>('Starred');
  const [qMinistry, setQMinistry] = useState('Higher Education & Skill Development');
  const [qSubmitterId, setQSubmitterId] = useState('');
  const [qText, setQText] = useState('');

  const filteredQuestions = questions.filter(q => {
    if (selectedType !== 'ALL' && q.type !== selectedType) return false;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const delegate = learners.find(l => l.id === qSubmitterId) || learners[0];
    const submitterName = delegate ? `${delegate.full_name} (MLA - ${delegate.constituency_name || 'TN Assembly'})` : 'MLA';
    const submitterParty = delegate?.party_name || 'Assembly';

    onAddQuestion({
      event_id: eventId,
      question_number: `${qType.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
      type: qType,
      ministry: qMinistry,
      submitter_name: submitterName,
      submitter_party: submitterParty,
      question_text: qText.trim(),
      status: 'Admitted'
    });

    setIsAddOpen(false);
    setQText('');
    onShowToast('Question Admitted', `Filed ${qType} question to ${qMinistry}`, 'success');
  };

  const handleSaveResponse = (id: string) => {
    if (!responseText.trim()) return;
    onAnswerQuestion(id, responseText.trim());
    setActiveAnswerId(null);
    setResponseText('');
    onShowToast('Minister Response Recorded', 'Answer officially recorded in Assembly Hansard', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl text-blue-500" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Question Hour & Zero Hour Motion Repository
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Manage Starred (Oral), Unstarred (Written), and Zero Hour queries tabled by MLAs to Ministers.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-102 shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Table New Question</span>
        </button>
      </div>

      {/* Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'Starred', 'Unstarred', 'Zero Hour', 'Calling Attention'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedType === type ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: selectedType === type ? 'var(--amber)' : 'var(--bg-surface)',
              color: selectedType === type ? '#ffffff' : 'var(--text-secondary)',
              borderColor: selectedType === type ? 'var(--amber)' : 'var(--border)'
            }}
          >
            {type === 'ALL' ? 'All Questions' : type}
          </button>
        ))}
      </div>

      {/* Questions Roster */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div
            className="py-12 text-center rounded-2xl border italic text-xs"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            No parliamentary questions found under this category. Click "+ Table New Question" to table queries.
          </div>
        ) : (
          filteredQuestions.map(q => (
            <div
              key={q.id}
              className="rounded-2xl p-5 border shadow-sm space-y-3 transition-all hover:border-amber-500/50"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/30">
                    {q.question_number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border" style={{ backgroundColor: 'var(--amber-soft)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                    {q.type}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Ministry of {q.ministry}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    q.status === 'Answered'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : q.status === 'Admitted'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    ● {q.status}
                  </span>
                </div>
              </div>

              {/* Submitter & Question Content */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <span>Tabled by: <strong style={{ color: 'var(--text-primary)' }}>{q.submitter_name}</strong></span>
                  <span>•</span>
                  <span>{q.submitter_party}</span>
                </div>
                <p className="text-sm font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  "{q.question_text}"
                </p>
              </div>

              {/* Minister Response Box */}
              {q.minister_response ? (
                <div
                  className="p-3.5 rounded-xl border space-y-1 bg-emerald-500/5 border-emerald-500/30 text-xs"
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                    Ministerial Oral/Written Response:
                  </span>
                  <p className="font-medium text-emerald-950 dark:text-emerald-200">
                    {q.minister_response}
                  </p>
                </div>
              ) : (
                <div className="pt-1">
                  {activeAnswerId === q.id ? (
                    <div className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <label className="block text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        Record Minister Answer / Floor Statement:
                      </label>
                      <textarea
                        rows={3}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Enter the official reply given by the Minister on the Assembly floor..."
                        className="w-full p-2 rounded-xl border text-xs focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveAnswerId(null)}
                          className="px-3 py-1 rounded-lg border text-xs font-semibold"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveResponse(q.id)}
                          className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                        >
                          Save Official Answer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveAnswerId(q.id);
                        setResponseText('');
                      }}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-amber-500 hover:text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> Record Minister Response
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Table Question Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Table Parliamentary Query
              </h4>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as ParliamentQuestion['type'])}
                    className="w-full p-2 rounded-xl border focus:outline-none font-semibold"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="Starred">Starred (Oral Answer)</option>
                    <option value="Unstarred">Unstarred (Written Answer)</option>
                    <option value="Zero Hour">Zero Hour Urgent Motion</option>
                    <option value="Calling Attention">Calling Attention</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Target Ministry</label>
                  <select
                    value={qMinistry}
                    onChange={(e) => setQMinistry(e.target.value)}
                    className="w-full p-2 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="Higher Education & Skill Development">Higher Education</option>
                    <option value="Public Health & Family Welfare">Public Health</option>
                    <option value="Information Technology & Digital Services">IT & Digital Services</option>
                    <option value="Finance & Revenue">Finance & Revenue</option>
                    <option value="Home & Public Administration">Home & Public Admin</option>
                    <option value="Agriculture & Farmers Welfare">Agriculture</option>
                    <option value="Transport & Highways">Transport & Highways</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Submitter Delegate (MLA)</label>
                <select
                  value={qSubmitterId}
                  onChange={(e) => setQSubmitterId(e.target.value)}
                  className="w-full p-2 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Member of Legislative Assembly --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.party_name || 'Independent'} • #{l.constituency_number || 'MLA'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Question Text *</label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Will the Hon. Minister state whether steps have been taken to..."
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border font-semibold text-xs cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Table Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
