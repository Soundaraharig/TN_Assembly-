import React, { useState } from 'react';
import type { Learner } from '../../types';
import { parseCSVFile } from '../../utils/csvHelper';
import { storageService } from '../../services/storageService';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  existingCodes: Set<string>;
  onImportSuccess: (learners: Partial<Learner>[]) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
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
  const [previewLearners, setPreviewLearners] = useState<Partial<Learner>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const isFrozen = storageService.getRegistrationsFrozen(eventId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFrozen) {
      onShowToast('Registrations Frozen', 'Cannot upload CSV while registrations are frozen', 'error');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setLoading(true);
      setErrors([]);

      const result = await parseCSVFile(selectedFile, eventId, new Set(existingCodes));
      setPreviewLearners(result.learners);
      setErrors(result.errors);
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `Name,Email,Phone,Department,Academic Year\nDeepak S,deepak@college.edu,+91 9876543210,Computer Science,3rd Year\nNisha R,nisha@college.edu,+91 9876543211,Electronics & Comm,2nd Year\nVijay M,vijay@college.edu,+91 9876543212,Mechanical,4th Year\nSrinivasan K,srini@college.edu,+91 9876543213,Biotechnology,1st Year`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TN_Assembly_Sample_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Template Downloaded', 'Use this CSV structure to import student delegates', 'info');
  };

  const handleConfirmImport = () => {
    if (isFrozen) {
      onShowToast('Registrations Frozen', 'Registrations are frozen by Assembly Coordinator', 'error');
      return;
    }
    if (previewLearners.length === 0) return;
    onImportSuccess(previewLearners);
    onShowToast('Import Successful', `Successfully imported ${previewLearners.length} student delegates with auto-generated 6-char access codes`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        
        {isFrozen && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>CSV Imports are disabled because Registrations are frozen by Assembly Coordinator.</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <Upload className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Import Participants via CSV / Excel</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          
          {/* Download Template Banner */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-200">Need a Sample CSV Template?</p>
              <p className="text-[11px] text-slate-400">Includes headers for Name, Email, Phone, Department, Academic Year</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx"
              id="csv-file-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
              <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">
                {file ? file.name : 'Click to Browse or Drag & Drop CSV File'}
              </p>
              <p className="text-[11px] text-slate-500">Supports CSV files up to 5MB</p>
            </label>
          </div>

          {loading && (
            <p className="text-xs text-amber-400 text-center py-2 animate-pulse">Parsing CSV file and generating 6-char access codes...</p>
          )}

          {errors.length > 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Warnings & Errors:
              </span>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Roster */}
          {previewLearners.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Preview Parsed Records ({previewLearners.length} Ready)</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Access Codes Generated
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto p-2 divide-y divide-slate-800/80 text-xs">
                {previewLearners.slice(0, 20).map((l, i) => (
                  <div key={i} className="py-1.5 px-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{i + 1}. {l.full_name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({l.department} • {l.academic_year})</span>
                    </div>
                    <code className="text-emerald-400 font-mono font-bold text-xs">{l.access_code}</code>
                  </div>
                ))}
                {previewLearners.length > 20 && (
                  <p className="text-[11px] text-slate-500 text-center py-1">...and {previewLearners.length - 20} more delegates</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={previewLearners.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Confirm & Import {previewLearners.length} Learners
          </button>
        </div>

      </div>
    </div>
  );
};
