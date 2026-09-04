import React, { useState, useMemo, useEffect } from 'react';
import type { Volunteer, UserRole, Party, Committee } from '../../types';
import { canDelete } from '../../utils/permissions';
import {
  Shield,
  Users,
  CheckCircle2,
  Plus,
  Upload,
  Copy,
  Check,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  X,
  FileText,
  Phone
} from 'lucide-react';
import Papa from 'papaparse';

interface VolunteersTabProps {
  volunteers: Volunteer[];
  eventId: string;
  userRole?: UserRole;
  parties?: Party[];
  committees?: Committee[];
  onAddVolunteer: (v: Partial<Volunteer>) => void;
  onToggleArrival?: (id: string) => void;
  onBulkImportVolunteers?: (volunteers: Partial<Volunteer>[]) => void;
  onDeleteVolunteer: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export interface YuvaAssignment {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerPhone: string;
  targetType: 'party' | 'committee';
  targetId: string;
  targetName: string;
}

const STATIONS = [
  "Floating",
  "Now Speaking (Speaker's aide)",
  "Voting Kiosks & Kiosk Support",
  "Registration & Delegate Reception",
  "Stage & Floor Coordination"
];

const SHIFTS = [
  "Both days",
  "Day 1",
  "Day 2"
];

export const VolunteersTab: React.FC<VolunteersTabProps> = ({
  volunteers,
  eventId,
  userRole,
  parties = [],
  committees = [],
  onAddVolunteer,
  onToggleArrival,
  onBulkImportVolunteers,
  onDeleteVolunteer,
  onShowToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'volunteers' | 'yuva_desks'>('volunteers');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const effectiveVolunteerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join`
    : 'https://tnassembly.vercel.app/join';

  // Form State
  const [name, setName] = useState('');
  const [station, setStation] = useState('Floating');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState('Both days');
  const [isYuva, setIsYuva] = useState(true);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Partial<Volunteer>[]>([]);

  // YUVA Desks Assignments State (Persisted)
  const storageKey = `tn_assembly_yuva_assignments_${eventId}`;
  const [yuvaAssignments, setYuvaAssignments] = useState<YuvaAssignment[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return [
      { id: 'ya_1', volunteerId: 'v1', volunteerName: 'Deeksha', volunteerPhone: '9600679949', targetType: 'party', targetId: 'p2', targetName: 'NEW INDIAN RENAISSANCE' },
      { id: 'ya_2', volunteerId: 'v2', volunteerName: 'Gandhavelu', volunteerPhone: '94448 41239', targetType: 'party', targetId: 'p2', targetName: 'NEW INDIAN RENAISSANCE' },
      { id: 'ya_3', volunteerId: 'v3', volunteerName: 'Deepika.V', volunteerPhone: '9080370992', targetType: 'party', targetId: 'p5', targetName: 'THE NAVODAYA PARTY' },
      { id: 'ya_4', volunteerId: 'v4', volunteerName: 'Gopika.D', volunteerPhone: '8122967836', targetType: 'party', targetId: 'p5', targetName: 'THE NAVODAYA PARTY' },
      { id: 'ya_5', volunteerId: 'v5', volunteerName: 'Mellbi', volunteerPhone: '8807564032', targetType: 'party', targetId: 'p1', targetName: 'RASHTRA NIRMAN PARTY' },
      { id: 'ya_6', volunteerId: 'v6', volunteerName: 'Manju R', volunteerPhone: '8778239050', targetType: 'party', targetId: 'p1', targetName: 'RASHTRA NIRMAN PARTY' },
      { id: 'ya_7', volunteerId: 'v7', volunteerName: 'Subiksha', volunteerPhone: '9025019197', targetType: 'party', targetId: 'p3', targetName: 'RASHTRA JANASWARA SANGHAM' },
      { id: 'ya_8', volunteerId: 'v8', volunteerName: 'Brindha N', volunteerPhone: '9025183153', targetType: 'party', targetId: 'p4', targetName: 'REVIA AAROH PARTY' },
      { id: 'ya_9', volunteerId: 'v9', volunteerName: 'Sharnitha', volunteerPhone: '9894782418', targetType: 'party', targetId: 'p4', targetName: 'REVIA AAROH PARTY' },
      { id: 'ya_10', volunteerId: 'v10', volunteerName: 'Poovarasan', volunteerPhone: '7418714199', targetType: 'committee', targetId: 'c_edu', targetName: 'Ministry of Education' },
      { id: 'ya_11', volunteerId: 'v11', volunteerName: 'Soundarahari', volunteerPhone: '7603814898', targetType: 'committee', targetId: 'c_edu', targetName: 'Ministry of Education' },
      { id: 'ya_12', volunteerId: 'v12', volunteerName: 'Rohan', volunteerPhone: '8489729978', targetType: 'committee', targetId: 'c_it', targetName: 'Ministry of Electronics & Information Technology' },
      { id: 'ya_13', volunteerId: 'v13', volunteerName: 'Roshna', volunteerPhone: '9965994574', targetType: 'committee', targetId: 'c_it', targetName: 'Ministry of Electronics & Information Technology' }
    ];
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(yuvaAssignments));
      }
    } catch {}
  }, [yuvaAssignments, storageKey]);

  // Form State for YUVA Desk Assignment
  const [selectedYuvaVolId, setSelectedYuvaVolId] = useState('');
  const [selectedTargetKey, setSelectedTargetKey] = useState('');

  // Default Parties and Committees lists if props are unpopulated
  const defaultYuvaParties: Party[] = [
    { id: 'p2', event_id: eventId, name: 'NEW INDIAN RENAISSANCE', bench: 'Opposition', color: '#e11d48' },
    { id: 'p5', event_id: eventId, name: 'THE NAVODAYA PARTY', bench: 'Opposition', color: '#e11d48' },
    { id: 'p1', event_id: eventId, name: 'RASHTRA NIRMAN PARTY', bench: 'Ruling', color: '#2563eb' },
    { id: 'p3', event_id: eventId, name: 'RASHTRA JANASWARA SANGHAM', bench: 'Ruling', color: '#2563eb' },
    { id: 'p4', event_id: eventId, name: 'REVIA AAROH PARTY', bench: 'Ruling', color: '#2563eb' }
  ];

  const defaultYuvaCommittees: Committee[] = [
    { id: 'c_agri', event_id: eventId, name: 'Ministry of Agriculture', topic: 'Agricultural Productivity & Farmer Welfare', max_capacity: 25 },
    { id: 'c_edu', event_id: eventId, name: 'Ministry of Education', topic: 'National Education & Skill Reform', max_capacity: 25 },
    { id: 'c_it', event_id: eventId, name: 'Ministry of Electronics & Information Technology', topic: 'Digital Public Infrastructure', max_capacity: 25 },
    { id: 'c_it2', event_id: eventId, name: 'Ministry of Electronics & IT', topic: 'AI Policy & Semiconductor Mission', max_capacity: 25 }
  ];

  const displayPartiesList = parties && parties.length > 0 ? parties : defaultYuvaParties;
  const displayCommitteesList = committees && committees.length > 0 ? committees : defaultYuvaCommittees;

  // Statistics
  const totalCount = volunteers.length;
  const yuvaCount = volunteers.filter(v => v.is_yuva !== false).length;
  const arrivedCount = volunteers.filter(v => v.has_arrived).length;

  // Group by station
  const groupedVolunteers = useMemo(() => {
    const groups: Record<string, Volunteer[]> = {};
    STATIONS.forEach(s => { groups[s] = []; });

    volunteers.forEach(v => {
      const st = v.station || 'Floating';
      if (!groups[st]) groups[st] = [];
      groups[st].push(v);
    });

    return groups;
  }, [volunteers]);

  const handleCopyVolunteerLink = () => {
    navigator.clipboard.writeText(effectiveVolunteerUrl);
    setCopiedLink(true);
    onShowToast('Link Copied', 'Volunteer access link copied to clipboard', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onShowToast('Copied', `Access code ${code} copied to clipboard`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddVolunteer({
      event_id: eventId,
      name: name.trim(),
      station,
      phone: phone.trim(),
      email: email.trim(),
      shift,
      is_yuva: isYuva,
      has_arrived: false,
      role: isYuva ? 'YUVA Volunteer' : 'Volunteer'
    });

    setName('');
    setPhone('');
    setEmail('');
    setIsAddFormOpen(false);
    onShowToast('Volunteer Added', `Added ${name} to ${station}`, 'success');
  };

  const handleAssignYuva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYuvaVolId || !selectedTargetKey) return;

    const vol = volunteers.find(v => v.id === selectedYuvaVolId);
    const [tType, tId, tName] = selectedTargetKey.split(':::');

    const volName = vol ? vol.name : (volunteers[0]?.name || 'YUVA Volunteer');
    const volPhone = vol ? (vol.phone || '9999999999') : '9999999999';

    const newAssign: YuvaAssignment = {
      id: `ya_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      volunteerId: selectedYuvaVolId,
      volunteerName: volName,
      volunteerPhone: volPhone,
      targetType: tType as 'party' | 'committee',
      targetId: tId,
      targetName: tName || tId
    };

    setYuvaAssignments(prev => [...prev, newAssign]);
    onShowToast('YUVA Assigned', `Assigned ${volName} to ${tName}`, 'success');
    setSelectedYuvaVolId('');
    setSelectedTargetKey('');
  };

  const handleRemoveYuvaAssignment = (assignId: string) => {
    setYuvaAssignments(prev => prev.filter(a => a.id !== assignId));
    onShowToast('Assignment Removed', 'Unassigned YUVA volunteer', 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: Partial<Volunteer>[] = results.data.map((row: any) => ({
            name: row.Name || row.name || row['Volunteer Name'] || 'Volunteer',
            phone: row.Phone || row.phone || row.Mobile || '',
            email: row.Email || row.email || '',
            station: row.Station || row.station || 'Floating',
            shift: row.Shift || row.shift || 'Both days',
            is_yuva: true,
            has_arrived: false
          })).filter((v: any) => v.name);

          setImportPreview(parsed);
        }
      });
    }
  };

  const handleConfirmImport = () => {
    if (importPreview.length > 0 && onBulkImportVolunteers) {
      onBulkImportVolunteers(importPreview);
      onShowToast('Roster Imported', `Imported ${importPreview.length} volunteers`, 'success');
      setIsImportModalOpen(false);
      setImportPreview([]);
      setImportFile(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveSubTab('volunteers')}
          className={`pb-3 px-1 transition-colors relative cursor-pointer ${
            activeSubTab === 'volunteers'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Volunteers
        </button>
        <button
          onClick={() => setActiveSubTab('yuva_desks')}
          className={`pb-3 px-1 transition-colors relative cursor-pointer ${
            activeSubTab === 'yuva_desks'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          YUVA Desks
        </button>
      </div>

      {activeSubTab === 'yuva_desks' ? (
        /* YUVA DESKS MANAGEMENT VIEW (Matching Screenshots 2 & 3) */
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Banner */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>YUVA Desks</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign YUVA volunteers to the parties and committees they handle for SRTN Regional YIP round. Students later see their YUVA contact based on this.
            </p>
          </div>

          {/* Assign a YUVA Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Assign a YUVA</h3>

            <form onSubmit={handleAssignYuva} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  YUVA volunteer
                </label>
                <select
                  value={selectedYuvaVolId}
                  onChange={(e) => setSelectedYuvaVolId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select a YUVA...</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.phone || 'YUVA'})</option>
                  ))}
                  {volunteers.length === 0 && (
                    <>
                      <option value="v1">Deeksha (9600679949)</option>
                      <option value="v2">Gandhavelu (94448 41239)</option>
                      <option value="v10">Poovarasan (7418714199)</option>
                      <option value="v11">Soundarahari (7603814898)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex-1 w-full space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Party or committee
                </label>
                <select
                  value={selectedTargetKey}
                  onChange={(e) => setSelectedTargetKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select...</option>
                  <optgroup label="Parties">
                    {displayPartiesList.map(p => (
                      <option key={`p_${p.id}`} value={`party:::${p.id}:::${p.name}`}>
                        Party: {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Committees">
                    {displayCommitteesList.map(c => (
                      <option key={`c_${c.id}`} value={`committee:::${c.id}:::${c.name}`}>
                        Committee: {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Assign
              </button>
            </form>
          </div>

          {/* Parties List Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🚩 Parties</span>
            </h3>

            <div className="space-y-3">
              {displayPartiesList.map((party, idx) => {
                const assignedYuvas = yuvaAssignments.filter(a => a.targetType === 'party' && (a.targetId === party.id || a.targetName === party.name));

                return (
                  <div
                    key={party.id || idx}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        #{idx + 1}
                      </span>
                      <strong className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {party.name}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-500">
                        {party.bench}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {assignedYuvas.length > 0 ? (
                        assignedYuvas.map(a => (
                          <div
                            key={a.id}
                            className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <span>{a.volunteerName}</span>
                            <span className="font-mono text-[11px] opacity-80 flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {a.volunteerPhone}
                            </span>
                            <button
                              onClick={() => handleRemoveYuvaAssignment(a.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                              title="Unassign YUVA"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No YUVA assigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Committees List Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🏛️ Committees</span>
            </h3>

            <div className="space-y-3">
              {displayCommitteesList.map((comm, idx) => {
                const assignedYuvas = yuvaAssignments.filter(a => a.targetType === 'committee' && (a.targetId === comm.id || a.targetName === comm.name));

                return (
                  <div
                    key={comm.id || idx}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-white">
                        {comm.name}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {assignedYuvas.length > 0 ? (
                        assignedYuvas.map(a => (
                          <div
                            key={a.id}
                            className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <span>{a.volunteerName}</span>
                            <span className="font-mono text-[11px] opacity-80 flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {a.volunteerPhone}
                            </span>
                            <button
                              onClick={() => handleRemoveYuvaAssignment(a.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                              title="Unassign YUVA"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No YUVA assigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* VOLUNTEERS ROSTER VIEW */
        <div className="space-y-6">
          {/* Main Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-500" />
                <span>Volunteer Roster</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                SRTN Regional YIP round · Handbook p.10 · Min 10 YUVA volunteers required
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import roster</span>
              </button>

              <button
                onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Volunteer</span>
              </button>
            </div>
          </div>

          {/* Volunteer Access Link Card (Matching Jury Access Link Requirement) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Volunteer access link
              </label>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <span>{effectiveVolunteerUrl}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Volunteers open this link and enter their access code to run voting kiosks on event day.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyVolunteerLink}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>

          {/* 3 Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Volunteers */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</div>
                <div className="text-xs text-slate-500 font-medium">Total Volunteers</div>
              </div>
            </div>

            {/* YUVA Volunteers */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {yuvaCount}<span className="text-sm font-semibold text-slate-400">/10 min</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">YUVA volunteers</div>
              </div>
            </div>

            {/* Arrived */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {arrivedCount}<span className="text-sm font-semibold text-slate-400">/{totalCount}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">Arrived</div>
              </div>
            </div>

          </div>

          {/* Add Volunteer Form (Inline Card) */}
          {isAddFormOpen && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add Volunteer</h4>
                <button onClick={() => setIsAddFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Volunteer full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Station</label>
                    <select
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      {STATIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shift</label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      {SHIFTS.map((sh) => (
                        <option key={sh} value={sh}>{sh}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="yuva-checkbox"
                    checked={isYuva}
                    onChange={(e) => setIsYuva(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="yuva-checkbox" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    YUVA volunteer
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Volunteer Groups by Station */}
          <div className="space-y-6">
            {Object.entries(groupedVolunteers).map(([groupStation, list]) => {
              if (list.length === 0) return null;
              
              const isNowSpeaking = groupStation.includes('Now Speaking');

              return (
                <div
                  key={groupStation}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  {/* Group Title */}
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isNowSpeaking ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {groupStation}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {list.length}
                    </span>
                  </div>

                  {/* Volunteer items grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {list.map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                      >
                        <div className="space-y-1">
                          {/* Name + Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {v.name}
                            </span>

                            {v.is_yuva && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                YUVA
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onToggleArrival && onToggleArrival(v.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                v.has_arrived
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                              title="Click to toggle arrival status"
                            >
                              <Check className="w-3 h-3" />
                              <span>{v.has_arrived ? 'Here' : 'Mark Arrived'}</span>
                            </button>
                          </div>

                          {/* Phone & Shift */}
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {v.phone || 'No phone'} · {v.shift || 'Both days'}
                          </div>

                          {/* Access code box */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(v.access_code)}
                              className="px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                              title="Click to copy access code"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>{v.access_code}</span>
                              {copiedCode === v.access_code ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-amber-600/70" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleArrival && onToggleArrival(v.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              v.has_arrived
                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={v.has_arrived ? "Mark as not arrived" : "Mark as arrived"}
                          >
                            {v.has_arrived ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>

                          {canDelete(userRole) && (
                            <button
                              type="button"
                              onClick={() => onDeleteVolunteer(v.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete volunteer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roster Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" /> Import Volunteer Roster
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-amber-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                id="vol-csv-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="vol-csv-input" className="cursor-pointer space-y-2 block">
                <FileText className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {importFile ? importFile.name : 'Select Volunteer CSV File'}
                </p>
                <p className="text-[10px] text-slate-500">Columns: Name, Phone, Email, Station, Shift</p>
              </label>
            </div>

            {importPreview.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                Found <strong>{importPreview.length}</strong> volunteers ready for import with auto-generated access codes.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importPreview.length === 0}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Import {importPreview.length} Volunteers
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
