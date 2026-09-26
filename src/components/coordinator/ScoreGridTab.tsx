import React, { useState, useMemo } from 'react';
import type { ScoreRecord, Learner, ScoringSession } from '../../types';
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
  AlertTriangle
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
  // Navigation & View Mode: ONLY TWO view modes: 'matrix' (default) and 'itemized'
  const [viewMode, setViewMode] = useState<'matrix' | 'itemized'>('matrix');
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isResetTestModalOpen, setIsResetTestModalOpen] = useState(false);
  const [isDeletingTestScores, setIsDeletingTestScores] = useState(false);

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'score_desc' | 'score_asc' | 'updated_desc' | 'name_asc'>('score_desc');

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
  // VIEW 1 DATA: Delegate Matrix Table (Primary Admin Result View)
  // ──────────────────────────────────────────────────────────────────────────
  const filteredScoreRecords = useMemo(() => {
    return eventScores
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
  // VIEW 2 DATA: Detailed Itemized Log (Audit & Verification)
  // ──────────────────────────────────────────────────────────────────────────
  const allItemizedRows = useMemo<ItemizedScoreRow[]>(() => {
    const rows: ItemizedScoreRow[] = [];

    eventScores.forEach(s => {
      const learner = learnerMap.get(s.learner_id);
      const studentName = s.learner_name || learner?.full_name || 'Delegate';
      const constNum = s.constituency_number ?? learner?.constituency_number;
      const constName = s.constituency_name || learner?.constituency_name || learner?.role || 'Assembly Seat';
      const party = s.party_name || learner?.party_name || 'Independent';
      const bench = s.bench || learner?.bench || 'Ruling';
      const accessCode = learner?.access_code || '';
      const active = isParticipantActive(learner);
      const juryName = s.juror_name || s.jury_id || 'Jury';
      const juryId = s.jury_id || juryName;
      const sessId = s.session_id || 'default_session';
      const sessName = s.session_name || 'Session';
      const totalScore = Number(s.total ?? 0);
      const createdAt = s.created_at || s.updated_at || new Date().toISOString();
      const updatedAt = s.updated_at || createdAt;
      const remarks = s.feedback || '';

      const catDefinitions = [
        { id: 'research_constituency', name: 'Research & Constituency', score: Number(s.research_constituency ?? s.policy_knowledge ?? 0), max: 30 },
        { id: 'relevance_agenda', name: 'Relevance to Agenda', score: Number(s.relevance_agenda ?? s.rebuttal_debate ?? 0), max: 20 },
        { id: 'communication_delivery', name: 'Communication & Delivery', score: Number(s.communication_delivery ?? s.oratory ?? 0), max: 20 },
        { id: 'parliamentary_conduct', name: 'Parliamentary Conduct', score: Number(s.parliamentary_conduct ?? 0), max: 12 },
        { id: 'originality_preparation', name: 'Originality & Prep', score: Number(s.originality_preparation ?? 0), max: 12 },
        { id: 'time_management', name: 'Time Management', score: Number(s.time_management ?? 0), max: 6 }
      ];

      catDefinitions.forEach(cat => {
        rows.push({
          key: `${s.id}_${cat.id}`,
          recordId: s.id,
          learnerId: s.learner_id,
          studentName,
          constituencyNumber: constNum,
          constituencyName: constName,
          partyName: party,
          bench,
          accessCode,
          isParticipantActive: active,
          juryId,
          juryName,
          sessionId: sessId,
          sessionName: sessName,
          categoryId: cat.id,
          categoryName: cat.name,
          score: cat.score,
          maxScore: cat.max,
          totalScore,
          createdAt,
          updatedAt,
          remarks
        });
      });

      rows.push({
        key: `${s.id}_total`,
        recordId: s.id,
        learnerId: s.learner_id,
        studentName,
        constituencyNumber: constNum,
        constituencyName: constName,
        partyName: party,
        bench,
        accessCode,
        isParticipantActive: active,
        juryId,
        juryName,
        sessionId: sessId,
        sessionName: sessName,
        categoryId: 'total',
        categoryName: 'Total Score',
        score: totalScore,
        maxScore: 100,
        totalScore,
        createdAt,
        updatedAt,
        remarks
      });
    });

    return rows;
  }, [eventScores, learnerMap]);

  const filteredItemizedRows = useMemo(() => {
    return allItemizedRows
      .filter(row => {
        // Participant status filter
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
    const totalRecords = eventScores.length;
    const uniqueLearners = new Set(eventScores.map(s => s.learner_id)).size;
    const uniqueJuries = new Set(eventScores.map(s => s.juror_name || s.jury_id)).size;
    const uniqueSessions = new Set(eventScores.map(s => s.session_id || s.session_name)).size;
    return { totalRecords, uniqueLearners, uniqueJuries, uniqueSessions };
  }, [eventScores]);

  // ──────────────────────────────────────────────────────────────────────────
  // CSV Export
  // ──────────────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
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
  // Test Scores Reset Controls
  // ──────────────────────────────────────────────────────────────────────────
  const handleOpenResetTestModal = () => {
    if (!isAuthorized) {
      onShowToast('Unauthorized', 'Only administrators are authorized to reset jury scores.', 'error');
      return;
    }
    if (eventScores.length === 0) {
      onShowToast(
        'No Scores Found',
        'There are no jury score records to reset for this event.',
        'info'
      );
      return;
    }
    setIsResetTestModalOpen(true);
  };

  const handleConfirmDeleteTestScores = async () => {
    if (!eventId) {
      onShowToast('Unable to reset test scores. No score data was changed.', 'Missing event identifier.', 'error');
      return;
    }
    setIsDeletingTestScores(true);
    try {
      const res = await storageService.resetTestScores(eventId);
      setIsResetTestModalOpen(false);
      onShowToast(
        'Test scores reset successfully.',
        `${res.deletedCount} test scores were reset.`,
        'success'
      );
      if (onResetScores) {
        onResetScores();
      }
    } catch (err: any) {
      onShowToast(
        'Unable to reset test scores. No score data was changed.',
        err?.message || 'Database error occurred.',
        'error'
      );
    } finally {
      setIsDeletingTestScores(false);
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
    const targetLearner = learners.find(l => l.id === modalStudentId);
    if (!targetLearner) {
      onShowToast('Select Delegate', 'Please select a valid delegate to score.', 'error');
      return;
    }

    const sessionObj = availableSessions.find(s => s.id === modalSessionId) || {
      id: modalSessionId,
      name: modalSessionId === 'zero_hour' ? 'Zero Hour'
        : modalSessionId === 'question_hour' ? 'Question Hour'
        : modalSessionId === 'bill_presenting' ? 'Bill Presenting'
        : modalSessionId === '90_sec_speech' ? '90 Sec Speech'
        : modalSessionId
    };

    const matchedJury = availableJuries.find(j => j.name === modalJuryName);
    const now = new Date().toISOString();

    const record: ScoreRecord = {
      id: `score_${targetLearner.id}_${sessionObj.id}_${matchedJury?.id || modalJuryName}_${Date.now()}`,
      event_id: eventId,
      session_id: sessionObj.id,
      session_name: sessionObj.name,
      learner_id: targetLearner.id,
      learner_name: targetLearner.full_name,
      constituency_number: targetLearner.constituency_number,
      constituency_name: targetLearner.constituency_name,
      party_name: targetLearner.party_name || 'Independent',
      bench: targetLearner.bench || 'Ruling',
      jury_id: matchedJury?.id || modalJuryName,
      juror_name: modalJuryName,
      research_constituency: modalResearch,
      relevance_agenda: modalRelevance,
      communication_delivery: modalComm,
      parliamentary_conduct: modalConduct,
      originality_preparation: modalOriginality,
      time_management: modalTime,
      oratory: modalComm,
      policy_knowledge: modalResearch,
      rebuttal_debate: modalRelevance,
      total: modalTotal,
      feedback: modalRemarks.trim(),
      is_test: modalIsTest,
      created_at: now,
      updated_at: now
    };

    onSaveScore(record);
    setIsGradeModalOpen(false);
    setModalStudentId('');
    setModalRemarks('');
    setModalIsTest(false);
    onShowToast(
      'Score Saved',
      `Saved score ${modalTotal}/100 in ${sessionObj.name} for ${targetLearner.full_name}${modalIsTest ? ' (Marked as Test)' : ''}`,
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
                Jury Score Management & Inspection
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Session-isolated scores database. Each score record is strictly anchored to Event + Session + Jury + Participant.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Reset Test Scores button (Clearly separated from normal score operations) */}
          <button
            type="button"
            onClick={handleOpenResetTestModal}
            className="px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition cursor-pointer hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
            title="Permanently remove all test/demo jury score records for this event"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Reset Test Scores</span>
            {eventScores.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                {eventScores.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            title="Download CSV of currently displayed scores"
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

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Scores</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-amber-500">{stats.totalRecords}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Permanent Supabase records</p>
        </div>

        <div className="p-4 rounded-2xl border shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scored Students</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-blue-500">{stats.uniqueLearners} <span className="text-xs text-slate-400 font-normal">/ {learners.length}</span></p>
          <p className="text-[10px] text-slate-400 mt-0.5">Assigned delegates</p>
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Sessions</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black mt-1 text-purple-500">{stats.uniqueSessions}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Discrete sessions evaluated</p>
        </div>
      </div>

      {/* Comprehensive Filter Controls */}
      <div
        className="rounded-2xl p-4 md:p-5 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Filters & Search Controls
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {viewMode === 'matrix' ? `${filteredScoreRecords.length} evaluations` : `${filteredItemizedRows.length} matching rows`}
            </span>
          </div>

          {/* View Mode Toggle: ONLY TWO modes: Delegate Matrix (default) & Itemized Log */}
          <div className="flex items-center gap-1 p-1 rounded-xl border bg-slate-100 dark:bg-slate-800/80" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Delegate Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewMode('itemized')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'itemized' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Itemized Log
            </button>
          </div>
        </div>

        {/* 6 Integrated Filters Grid */}
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
              <option value="ALL">All Sessions</option>
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

          {/* 4. Category Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Category
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

          {/* 5. Party / Bench Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Bench / Party
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

          {/* 6. Sort Order */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
              Sorting
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
            placeholder="Search scores by student name, access code, seat # (#42), constituency, jury, or session..."
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

      {/* VIEW 1: Delegate Matrix Table (Primary Admin Result View - DEFAULT) */}
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

      {/* VIEW 2: Itemized Score Log Table (Detailed Audit View) */}
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
                  This will permanently remove all jury score records for this event.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 space-y-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Event:</span>
                <p className="text-sm font-black truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {eventName || 'Current Event'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <span className="text-slate-400">Scores to be removed:</span>
                <span className="font-mono font-black text-rose-500 text-sm px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                  {eventScores.length}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>This action cannot be undone.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetTestModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border font-semibold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                disabled={isDeletingTestScores}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTestScores}
                disabled={isDeletingTestScores || eventScores.length === 0}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingTestScores ? 'Resetting...' : 'Reset Test Scores'}</span>
              </button>
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
