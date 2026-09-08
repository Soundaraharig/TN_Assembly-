import React, { useState } from 'react';
import type { Learner } from '../../types';
import { parseCSVFile, exportAllocationTemplateCSV, type CSVImportStats } from '../../utils/csvHelper';
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
  Users
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  existingCodes: Set<string>;
  onImportSuccess: (learners: Partial<Learner>[]) => Promise<any> | void;
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

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  eventId,
  existingCodes,
  onImportSuccess,
  onShowToast
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewLearners, setPreviewLearners] = useState<Partial<Learner>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [stats, setStats] = useState<CSVImportStats | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [mappedFields, setMappedFields] = useState<string[]>([]);
  const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([]);
  const [importReport, setImportReport] = useState<ImportReportData | null>(null);

  if (!isOpen) return null;

  const isFrozen = storageService.getRegistrationsFrozen(eventId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFrozen) {
      onShowToast('Registrations Frozen', 'Cannot upload CSV while registrations are frozen', 'error');
      return;
    }
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
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

  const handleConfirmImport = async () => {
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

  const handleResetModal = () => {
    setFile(null);
    setPreviewLearners([]);
    setErrors([]);
    setStats(null);
    setDetectedHeaders([]);
    setMappedFields([]);
    setUnmappedHeaders([]);
    setImportReport(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">
        
        {isFrozen && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>CSV Imports are disabled because Registrations are frozen by Assembly Coordinator.</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <Upload className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold text-white">Import Participants & Pre-Allocations</h3>
              <p className="text-[11px] text-slate-400">
                Supports standard rosters or pre-allocated sheets with constituencies, parties, and committees
              </p>
            </div>
          </div>
          <button onClick={handleResetModal} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          
          {/* Post-Import Report Screen */}
          {importReport ? (
            <div className="space-y-5 animate-scale-in py-2">
              <div className="text-center p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-300">Import & Sync Successful!</h4>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  All {importReport.totalRows} delegates and pre-allocated assignments have been saved into Supabase and marked as assigned.
                </p>
              </div>

              {/* Report Stats Grid */}
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

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Preservation Guarantee
                </span>
                <p className="text-[11px] text-slate-400">
                  Imported constituency, party, and committee allocations are treated as already assigned. Automatic allocation will skip delegates with existing assignments, leaving these records preserved.
                </p>
              </div>
            </div>
          ) : (
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
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
                    title="Template with Student Name, Constituency Number, Party Assignment, Committee & Constituency Name"
                  >
                    <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pre-Allocation Template (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadStandardTemplate}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
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
                  id="csv-file-input"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                  <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">
                    {file ? file.name : 'Click to Browse or Drag & Drop CSV / Excel File'}
                  </p>
                  <p className="text-[11px] text-slate-500">Supports .csv, .xlsx, and .xls files</p>
                </label>
              </div>

              {loading && (
                <p className="text-xs text-amber-400 text-center py-2 animate-pulse font-medium">
                  Parsing records, matching constituencies & generating access codes...
                </p>
              )}

              {/* Pre-Import Breakdown: Columns & Mappings */}
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

                  {/* Detected vs Mapped */}
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

              {/* Pre-Import Breakdown: Row Statistics */}
              {stats && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Pre-Import Row Diagnostics
                  </span>
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
                      <li className="text-rose-400 font-semibold">
                        ...and {errors.length - 10} more warnings
                      </li>
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
                          
                          {/* Allocation badges */}
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
                              {l.role && l.role !== 'Member of Legislative Assembly (MLA)' && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                  {l.role}
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
          )}

        </div>

        {/* Import Error Banner */}
        {importError && (
          <div className="mb-3 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{importError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
          {importReport ? (
            <button
              onClick={handleResetModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done (View Allocations)</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleResetModal}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={previewLearners.length === 0 || isImporting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isImporting
                    ? 'Saving to Supabase...'
                    : `Confirm & Import ${previewLearners.length} Delegates`
                  }
                </span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

