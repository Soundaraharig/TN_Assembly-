import React, { useState } from 'react';
import type { Learner, Party, Committee } from '../../types';
import { parseCSVFile, exportAllocationTemplateCSV, type CSVImportStats } from '../../utils/csvHelper';
import {
  parseUpdateCSVFile,
  exportExistingParticipantsUpdateTemplate,
  type UpdateCSVParseResult
} from '../../utils/csvUpdateHelper';
import { storageService } from '../../services/storageService';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lock,
  Landmark,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Users,
  UserPlus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  existingCodes: Set<string>;
  learners?: Learner[];
  parties?: Party[];
  committees?: Committee[];
  onImportSuccess: (learners: Partial<Learner>[]) => Promise<any> | void;
  onParticipantsUpdated?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

interface ImportReportData {
  totalRows: number;
  partiesMatched: number;
  partiesCreated: number;
  committeesMatched: number;
  committeesCreated: number;
  constituenciesMatched: number;
}

interface UpdateReportData {
  countBefore: number;
  countAfter: number;
  updatedCount: number;
  failedCount: number;
  unchangedCount: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  eventId,
  existingCodes,
  learners: propLearners,
  parties: propParties,
  committees: propCommittees,
  onImportSuccess,
  onParticipantsUpdated,
  onShowToast
}) => {
  // Mode switcher
  const [activeMode, setActiveMode] = useState<'NEW_PARTICIPANTS' | 'UPDATE_EXISTING'>('NEW_PARTICIPANTS');

  // Shared file & loading states
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // New participants import state
  const [previewLearners, setPreviewLearners] = useState<Partial<Learner>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [stats, setStats] = useState<CSVImportStats | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [mappedFields, setMappedFields] = useState<string[]>([]);
  const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([]);
  const [importReport, setImportReport] = useState<ImportReportData | null>(null);

  // Update existing participants state
  const [updateParseResult, setUpdateParseResult] = useState<UpdateCSVParseResult | null>(null);
  const [updateReport, setUpdateReport] = useState<UpdateReportData | null>(null);

  if (!isOpen) return null;

  const isFrozen = storageService.getRegistrationsFrozen(eventId);

  // Authoritative sources for event data
  const currentLearners = propLearners && propLearners.length > 0 ? propLearners : storageService.getLearners(eventId);
  const currentParties = propParties && propParties.length > 0 ? propParties : storageService.getParties(eventId);
  const currentCommittees = propCommittees && propCommittees.length > 0 ? propCommittees : storageService.getCommittees(eventId);

  const handleResetFile = () => {
    setFile(null);
    setLoading(false);
    setIsImporting(false);
    setImportError(null);
    setPreviewLearners([]);
    setErrors([]);
    setStats(null);
    setDetectedHeaders([]);
    setMappedFields([]);
    setUnmappedHeaders([]);
    setImportReport(null);
    setUpdateParseResult(null);
    setUpdateReport(null);
  };

  const handleResetModal = () => {
    handleResetFile();
    onClose();
  };

  // --- Handlers for "Add New Participants" ---
  const handleNewFileChange = async (selectedFile: File) => {
    setLoading(true);
    setErrors([]);
    setImportError(null);
    setImportReport(null);

    try {
      const result = await parseCSVFile(selectedFile, eventId, new Set(existingCodes));
      setPreviewLearners(result.learners);
      setErrors(result.errors);
      setStats(result.stats);
      setDetectedHeaders(result.detectedHeaders);
      setMappedFields(result.mappedFields);
      setUnmappedHeaders(result.unmappedHeaders);

      if (result.learners.length > 0) {
        onShowToast(
          'File Processed',
          `Parsed ${result.learners.length} valid delegate records with column mappings`,
          'info'
        );
      }
    } catch (err: any) {
      setErrors([err.message || 'Failed to parse file.']);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStandardTemplate = () => {
    const csvContent = `Name,Email,Phone,Department,Academic Year\nDeepak S,deepak@college.edu,+91 9876543210,Computer Science,3rd Year\nNisha R,nisha@college.edu,+91 9876543211,Electronics & Comm,2nd Year\nVijay M,vijay@college.edu,+91 9876543212,Mechanical,4th Year\nSrinivasan K,srini@college.edu,+91 9876543213,Biotechnology,1st Year`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TN_Assembly_Sample_Delegate_Roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Template Downloaded', 'Use this CSV structure to import student delegates', 'info');
  };

  const handleDownloadAllocationTemplate = () => {
    exportAllocationTemplateCSV();
    onShowToast('Allocation Template Downloaded', 'Template includes Student Name, Constituency Number, Party Assignment, Committee & Constituency Name', 'info');
  };

  const handleConfirmNewImport = async () => {
    if (isFrozen) {
      onShowToast('Registrations Frozen', 'Registrations are frozen by Assembly Coordinator', 'error');
      return;
    }
    if (previewLearners.length === 0) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await onImportSuccess(previewLearners);
      const report: ImportReportData = {
        totalRows: res?.report?.totalRows ?? previewLearners.length,
        partiesMatched: res?.report?.partiesMatched ?? stats?.rowsWithParty ?? 0,
        partiesCreated: res?.report?.partiesCreated ?? 0,
        committeesMatched: res?.report?.committeesMatched ?? stats?.rowsWithCommittee ?? 0,
        committeesCreated: res?.report?.committeesCreated ?? 0,
        constituenciesMatched: res?.report?.constituenciesMatched ?? stats?.rowsWithConstituency ?? 0,
      };
      setImportReport(report);
      onShowToast(
        'Import Successful',
        `Successfully imported ${report.totalRows} delegates (${report.constituenciesMatched} constituencies, ${report.partiesMatched + report.partiesCreated} parties, ${report.committeesMatched + report.committeesCreated} committees)`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to save imported participants to database.';
      setImportError(msg);
      onShowToast('Import Failed', msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // --- Handlers for "Update Existing Participants" ---
  const handleUpdateFileChange = async (selectedFile: File) => {
    setLoading(true);
    setImportError(null);
    setUpdateReport(null);

    try {
      const parseRes = await parseUpdateCSVFile(selectedFile, currentLearners, currentParties, currentCommittees);
      setUpdateParseResult(parseRes);

      if (parseRes.willUpdateCount > 0) {
        onShowToast(
          'Update File Processed',
          `Matched ${parseRes.matchedCount} participants: ${parseRes.willUpdateCount} will be updated`,
          'info'
        );
      } else if (parseRes.matchedCount > 0 && parseRes.willUpdateCount === 0) {
        onShowToast(
          'No Differences',
          `Matched ${parseRes.matchedCount} participants, but all specified values already match existing data`,
          'info'
        );
      }
    } catch (err: any) {
      setImportError(err?.message || 'Failed to process update spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadUpdateTemplate = () => {
    exportExistingParticipantsUpdateTemplate(currentLearners, currentParties, currentCommittees);
    onShowToast(
      'Update Template Downloaded',
      `Generated template pre-filled with ${currentLearners.length} current participants & access codes`,
      'success'
    );
  };

  const handleApplyExistingUpdates = async () => {
    if (isFrozen) {
      onShowToast('Registrations Frozen', 'Registrations are frozen by Assembly Coordinator', 'error');
      return;
    }
    if (!updateParseResult || updateParseResult.willUpdateCount === 0) return;

    // Safety checks: stop if duplicate identifiers exist
    if (updateParseResult.duplicateRows.length > 0) {
      onShowToast('Blocked', 'Cannot apply updates while duplicate identifiers exist in file', 'error');
      return;
    }

    if (updateParseResult.validationErrors.length > 0) {
      onShowToast('Blocked', 'Cannot apply updates while validation errors exist in file', 'error');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      // Build targeted patch updates
      const updatesToApply = updateParseResult.updates
        .filter(u => u.changes.length > 0)
        .map(u => ({
          id: u.learnerId,
          patch: u.patch
        }));

      const res = await storageService.updateExistingParticipants(eventId, updatesToApply);

      if (!res.success && res.error) {
        throw res.error;
      }

      setUpdateReport({
        countBefore: res.countBefore,
        countAfter: res.countAfter,
        updatedCount: res.updatedCount,
        failedCount: res.failedCount,
        unchangedCount: res.unchangedCount
      });

      if (onParticipantsUpdated) {
        onParticipantsUpdated();
      }

      onShowToast(
        'Updates Applied Successfully',
        `Updated ${res.updatedCount} participants. Total count verified: ${res.countAfter} students preserved.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to apply participant updates.';
      setImportError(msg);
      onShowToast('Update Failed', msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenericFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFrozen) {
      onShowToast('Registrations Frozen', 'Cannot upload CSV while registrations are frozen', 'error');
      return;
    }
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    if (activeMode === 'NEW_PARTICIPANTS') {
      handleNewFileChange(selectedFile);
    } else {
      handleUpdateFileChange(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">

        {isFrozen && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>CSV Imports & Updates are disabled because Registrations are frozen by Assembly Coordinator.</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <Upload className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Import & Update Participants</h3>
              <p className="text-[11px] text-slate-400">
                Choose between importing new participant rosters or safely updating existing participant allocations
              </p>
            </div>
          </div>
          <button onClick={handleResetModal} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!importReport && !updateReport && (
          <div className="flex items-center p-1 bg-slate-950/90 rounded-xl border border-slate-800 gap-1 mb-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveMode('NEW_PARTICIPANTS');
                handleResetFile();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'NEW_PARTICIPANTS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Participants</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('UPDATE_EXISTING');
                handleResetFile();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'UPDATE_EXISTING'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Existing Participants</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-200 border border-blue-400/30">
                Safe Patch Only
              </span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">

          {/* ========================================================================= */}
          {/* POST-IMPORT REPORT SCREENS                                               */}
          {/* ========================================================================= */}
          {importReport ? (
            <div className="space-y-5 animate-scale-in py-2">
              <div className="text-center p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-300">Import & Sync Successful!</h4>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  All {importReport.totalRows} delegates and pre-allocated assignments have been saved into Supabase.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> Total Rows
                  </div>
                  <div className="text-xl font-black text-white mt-1">{importReport.totalRows}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Imported 100%</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" /> Constituencies
                  </div>
                  <div className="text-xl font-black text-purple-300 mt-1">{importReport.constituenciesMatched}</div>
                  <div className="text-[10px] text-purple-400/80 font-semibold mt-0.5">TN 1–234 Matched</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Parties
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    {importReport.partiesMatched + importReport.partiesCreated}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-semibold mt-0.5">
                    {importReport.partiesMatched} matched{importReport.partiesCreated > 0 ? `, ${importReport.partiesCreated} added` : ''}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Committees
                  </div>
                  <div className="text-xl font-black text-emerald-300 mt-1">
                    {importReport.committeesMatched + importReport.committeesCreated}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-semibold mt-0.5">
                    {importReport.committeesMatched} matched{importReport.committeesCreated > 0 ? `, ${importReport.committeesCreated} added` : ''}
                  </div>
                </div>
              </div>
            </div>
          ) : updateReport ? (
            <div className="space-y-5 animate-scale-in py-2">
              <div className="text-center p-6 bg-blue-950/40 border border-blue-500/30 rounded-2xl space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-blue-300">Existing Participants Updated & Verified!</h4>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  Successfully updated {updateReport.updatedCount} participant records in Supabase. Fresh data has been re-synchronized.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Participants</div>
                  <div className="text-xl font-black text-white mt-1">{updateReport.countAfter}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Zero Deleted / Added</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Updated</div>
                  <div className="text-xl font-black text-blue-400 mt-1">{updateReport.updatedCount}</div>
                  <div className="text-[10px] text-blue-300 font-semibold mt-0.5">Targeted PATCH applied</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Unchanged</div>
                  <div className="text-xl font-black text-slate-300 mt-1">{updateReport.unchangedCount}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Already Matching</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Failed</div>
                  <div className="text-xl font-black text-rose-400 mt-1">{updateReport.failedCount}</div>
                  <div className="text-[10px] text-rose-300 font-semibold mt-0.5">Errors</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Data Safety Invariants Maintained
                </span>
                <p className="text-[11px] text-slate-400">
                  • Total participants before: <strong>{updateReport.countBefore}</strong> | Total participants after: <strong>{updateReport.countAfter}</strong><br />
                  • Access codes, names, contact numbers, attendance, bench, and roles were 100% preserved.<br />
                  • Supabase remote records were refreshed directly from database queries.
                </p>
              </div>
            </div>
          ) : activeMode === 'NEW_PARTICIPANTS' ? (
            /* ========================================================================= */
            /* MODE: ADD NEW PARTICIPANTS (STANDARD IMPORT)                              */
            /* ========================================================================= */
            <>
              {/* Download Templates Banner */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200">Need a Sample Spreadsheet Template?</p>
                    <p className="text-[11px] text-slate-400">Choose between simple participant roster or full allocation mapping</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadAllocationTemplate}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors cursor-pointer"
                    title="Template with Student Name, Constituency Number, Party Assignment, Committee & Constituency Name"
                  >
                    <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pre-Allocation Template (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadStandardTemplate}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                    title="Simple roster template with Name, Email, Phone, Dept, Year"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Standard Roster Template (CSV)</span>
                  </button>
                </div>
              </div>

              {/* File Upload Box */}
              <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  id="csv-file-input-new"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={handleGenericFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input-new" className="cursor-pointer space-y-2 block">
                  <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">
                    {file ? file.name : 'Click to Browse or Drag & Drop Roster CSV / Excel File'}
                  </p>
                  <p className="text-[11px] text-slate-500">Supports .csv, .xlsx, and .xls files</p>
                </label>
              </div>

              {loading && (
                <p className="text-xs text-amber-400 text-center py-2 animate-pulse font-medium">
                  Parsing records, matching constituencies & generating access codes...
                </p>
              )}

              {/* Detected Headers */}
              {detectedHeaders.length > 0 && (
                <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" /> Detected Sheet Structure
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {detectedHeaders.length} columns detected
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 w-24 pt-0.5">
                        Detected:
                      </span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {detectedHeaders.map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-mono border border-slate-700"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 shrink-0 w-24 pt-0.5">
                        Mapped To:
                      </span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {mappedFields.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1"
                          >
                            <ArrowRight className="w-2.5 h-2.5" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {unmappedHeaders.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0 w-24 pt-0.5">
                          Unmapped:
                        </span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {unmappedHeaders.map((u, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 text-[10px] font-mono border border-amber-500/30"
                              title="Ignored during import"
                            >
                              {u} (ignored)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Row Diagnostics */}
              {stats && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Pre-Import Row Diagnostics</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Total Rows</span>
                      <strong className="text-sm text-white font-extrabold">{stats.totalRows}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">With Constituency</span>
                      <strong className="text-sm text-purple-400 font-extrabold">{stats.rowsWithConstituency}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">With Party</span>
                      <strong className="text-sm text-blue-400 font-extrabold">{stats.rowsWithParty}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">With Committee</span>
                      <strong className="text-sm text-emerald-400 font-extrabold">{stats.rowsWithCommittee}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Missing Optional</span>
                      <strong className="text-sm text-amber-400 font-extrabold">{stats.rowsWithMissingOptional}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings & Errors List */}
              {errors.length > 0 && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    Conflict Warnings & Issues ({errors.length}):
                  </span>
                  <ul className="list-disc list-inside text-[11px] space-y-1 max-h-32 overflow-y-auto">
                    {errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {errors.length > 10 && (
                      <li className="text-rose-400 font-semibold">...and {errors.length - 10} more warnings</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview Roster */}
              {previewLearners.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Preview Parsed Records ({previewLearners.length} Ready)</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Import
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-52 overflow-y-auto p-2 divide-y divide-slate-800/80 text-xs">
                    {previewLearners.slice(0, 25).map((l, i) => (
                      <div key={i} className="py-2 px-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{i + 1}. {l.full_name}</span>
                            <span className="text-[11px] text-slate-400">({l.department} • {l.academic_year})</span>
                          </div>

                          {(l.constituency_number !== undefined || l.party_name || l.committee_name) && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                              {l.constituency_number !== undefined && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold font-mono flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" /> #{l.constituency_number} {l.constituency_name || ''}
                                </span>
                              )}
                              {l.party_name && (
                                <span className={`px-1.5 py-0.5 rounded font-semibold border ${
                                  l.bench === 'Ruling'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                }`}>
                                  {l.party_name} {l.bench ? `(${l.bench})` : ''}
                                </span>
                              )}
                              {l.committee_name && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold flex items-center gap-1">
                                  <Building2 className="w-2.5 h-2.5" /> {l.committee_name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <code className="text-emerald-400 font-mono font-bold text-xs shrink-0">{l.access_code}</code>
                      </div>
                    ))}
                    {previewLearners.length > 25 && (
                      <p className="text-[11px] text-slate-500 text-center py-2">
                        ...and {previewLearners.length - 25} more delegates
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ========================================================================= */
            /* MODE: UPDATE EXISTING PARTICIPANTS                                        */
            /* ========================================================================= */
            <>
              {/* Safety Guarantee Notice */}
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1.5 text-xs text-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-blue-100">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Targeted Participant Updates Mode
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadUpdateTemplate}
                    className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800/60 text-blue-200 font-semibold text-[11px] flex items-center gap-1 border border-blue-400/30 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-blue-300" />
                    <span>Download Pre-filled Template (CSV)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Updates <strong>ONLY Party, Committee, Constituency Name & Constituency Number</strong> for existing delegates.
                  Uses <code>Access Code</code> to find records. Will <strong>NEVER</strong> delete, create duplicate, or modify access codes, names, or passwords.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 text-center bg-slate-950/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  id="csv-file-input-update"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={handleGenericFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input-update" className="cursor-pointer space-y-2 block">
                  <RefreshCw className="w-10 h-10 text-blue-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">
                    {file ? file.name : 'Click to Browse or Drag & Drop Update Sheet (CSV / Excel)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports 1 to {currentLearners.length} participant rows. Partial columns supported.
                  </p>
                </label>
              </div>

              {loading && (
                <p className="text-xs text-blue-400 text-center py-2 animate-pulse font-medium">
                  Matching participants by access code & checking diffs...
                </p>
              )}

              {/* Diagnostics & Parse Results */}
              {updateParseResult && (
                <div className="space-y-3">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Sheet Rows</span>
                      <strong className="text-sm text-white font-extrabold">{updateParseResult.totalRows}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Matched Students</span>
                      <strong className="text-sm text-emerald-400 font-extrabold">{updateParseResult.matchedCount}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Will Update</span>
                      <strong className="text-sm text-blue-400 font-extrabold">{updateParseResult.willUpdateCount}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Already Matching</span>
                      <strong className="text-sm text-slate-300 font-extrabold">{updateParseResult.unchangedCount}</strong>
                    </div>
                  </div>

                  {/* Duplicate Identifier Alert (BLOCKING) */}
                  {updateParseResult.duplicateRows.length > 0 && (
                    <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 space-y-1.5">
                      <span className="font-bold flex items-center gap-1.5 text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        Duplicate Identifiers Detected ({updateParseResult.duplicateRows.length}):
                      </span>
                      <p className="text-[11px] text-rose-200/90">
                        The CSV contains duplicate identifier rows. Import is blocked to prevent accidental overwrites.
                      </p>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-24 overflow-y-auto font-mono">
                        {updateParseResult.duplicateRows.map((d, i) => (
                          <li key={i}>
                            Row {d.rowNumber}: {d.identifierType} &quot;{d.identifier}&quot; {d.studentName ? `(${d.studentName})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Errors Alert (BLOCKING) */}
                  {updateParseResult.validationErrors.length > 0 && (
                    <div className="p-3.5 bg-amber-950/50 border border-amber-500/50 rounded-xl text-xs text-amber-300 space-y-1.5">
                      <span className="font-bold flex items-center gap-1.5 text-amber-200">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        Invalid Allocations Detected ({updateParseResult.validationErrors.length}):
                      </span>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-28 overflow-y-auto">
                        {updateParseResult.validationErrors.map((v, i) => (
                          <li key={i}>
                            Row {v.rowNumber} ({v.identifier}): {v.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Unmatched Rows Alert (Non-blocking warning) */}
                  {updateParseResult.unmatchedRows.length > 0 && (
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5">
                      <span className="font-bold flex items-center gap-1.5 text-amber-400">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        Unmatched Rows ({updateParseResult.unmatchedRows.length}) — Will NOT be imported:
                      </span>
                      <p className="text-[11px] text-slate-400">
                        These rows did not match any existing participant in this event. They will be safely skipped.
                      </p>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-24 overflow-y-auto font-mono text-slate-400">
                        {updateParseResult.unmatchedRows.map((u, i) => (
                          <li key={i}>
                            Row {u.rowNumber}: {u.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detailed Changes Preview Table */}
                  {updateParseResult.willUpdateCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          Update Preview ({updateParseResult.willUpdateCount} Participants with Changes)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {updateParseResult.updates.reduce((sum, u) => sum + u.changes.length, 0)} field modifications
                        </span>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-800/80 text-xs">
                        {updateParseResult.updates
                          .filter(u => u.changes.length > 0)
                          .map((u, i) => (
                            <div key={i} className="p-2.5 space-y-1.5 hover:bg-slate-900/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{u.studentName}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {u.accessCode}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500">Row {u.rowNumber}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {u.changes.map((c, ci) => (
                                  <div
                                    key={ci}
                                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between gap-2"
                                  >
                                    <span className="text-slate-400 font-medium shrink-0">{c.fieldLabel}:</span>
                                    <div className="flex items-center gap-1.5 overflow-hidden text-right">
                                      <span className="text-rose-400/90 line-through truncate max-w-[90px]" title={c.oldValue}>
                                        {c.oldValue}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                                      <span className="text-emerald-400 font-bold truncate max-w-[110px]" title={c.newValue}>
                                        {c.newValue}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {updateParseResult.matchedCount > 0 && updateParseResult.willUpdateCount === 0 && (
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-center space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-200">All Records Already Up-to-Date</p>
                      <p className="text-[11px] text-slate-400">
                        All {updateParseResult.matchedCount} matched participants already have the exact Party, Committee, and Constituency values specified in your spreadsheet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Error Banner */}
        {importError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{importError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
          {importReport || updateReport ? (
            <button
              type="button"
              onClick={handleResetModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done (View Participants)</span>
            </button>
          ) : activeMode === 'NEW_PARTICIPANTS' ? (
            <>
              <button
                type="button"
                onClick={handleResetModal}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNewImport}
                disabled={previewLearners.length === 0 || isImporting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isImporting
                    ? 'Saving to Supabase...'
                    : `Confirm & Import ${previewLearners.length} Delegates`}
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResetModal}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyExistingUpdates}
                disabled={
                  !updateParseResult ||
                  updateParseResult.willUpdateCount === 0 ||
                  updateParseResult.duplicateRows.length > 0 ||
                  updateParseResult.validationErrors.length > 0 ||
                  isImporting
                }
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                <span>
                  {isImporting
                    ? 'Applying Targeted Updates...'
                    : updateParseResult && updateParseResult.duplicateRows.length > 0
                    ? 'Fix Duplicate Identifiers to Apply'
                    : updateParseResult && updateParseResult.validationErrors.length > 0
                    ? 'Fix Validation Errors to Apply'
                    : updateParseResult && updateParseResult.willUpdateCount > 0
                    ? `Apply Updates (${updateParseResult.willUpdateCount} Participants)`
                    : 'Select File with Changes'}
                </span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
