import React, { useState } from 'react';
import type { TeamMember, UserRole } from '../../types';
import { canManageTeam } from '../../utils/permissions';
import {
  Users,
  User,
  Plus,
  Mail,
  Trash2,
  Check,
  Copy,
  AlertCircle,
  AlertTriangle,
  X,
  KeyRound,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

interface TeamTabProps {
  team: TeamMember[];
  eventId: string;
  userRole?: UserRole;
  onAddMember: (tm: Partial<TeamMember>) => { member: TeamMember; initialPassword?: string } | void;
  onUpdateMember?: (tm: Partial<TeamMember> & { id: string }) => void;
  onDeleteMember: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({
  team,
  eventId,
  userRole,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onShowToast
}) => {
  const isAuthorizedToManage = canManageTeam(userRole);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Organiser' | 'Coordinator'>('Organiser');

  // Inline Errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; general?: string }>({});

  // Generated Credential Banner State
  const [createdCredential, setCreatedCredential] = useState<{
    name: string;
    email: string;
    role: string;
    accessCode: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Delete Confirmation Modal State
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Editing Role State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Filter team members for this event
  const currentTeam = team.filter(t => t.event_id === eventId || !t.event_id);
  const coordinatorsCount = currentTeam.filter(t => t.role === 'Coordinator').length;

  const validateEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; general?: string } = {};

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      newErrors.name = 'Full Name is required';
    }

    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    } else {
      const duplicate = currentTeam.find(t => t.email.trim().toLowerCase() === trimmedEmail);
      if (duplicate) {
        newErrors.email = `A team member with email "${trimmedEmail}" is already added to this election.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const result = onAddMember({
        event_id: eventId,
        name: trimmedName,
        email: trimmedEmail,
        role: role,
        department: role === 'Coordinator' ? 'Election Administration' : 'Event Operations'
      });

      const accessCode = result?.initialPassword || result?.member?.access_code || `TN${Math.floor(100000 + Math.random() * 900000)}`;

      setCreatedCredential({
        name: trimmedName,
        email: trimmedEmail,
        role: role,
        accessCode: accessCode
      });

      setName('');
      setEmail('');
      setRole('Organiser');

      onShowToast(
        'Team Member Added',
        `Successfully added ${trimmedName} as ${role} for this election.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to add team member';
      setErrors({ general: msg });
      onShowToast('Error', msg, 'error');
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredential) return;
    const textToCopy = `TN Assembly Election Access Credentials\nName: ${createdCredential.name}\nEmail: ${createdCredential.email}\nRole: ${createdCredential.role}\nAccess Code: ${createdCredential.accessCode}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPass(true);
    onShowToast('Credentials Copied', 'Login access code copied to clipboard', 'info');
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) return;

    if (memberToDelete.role === 'Coordinator' && coordinatorsCount <= 1) {
      setDeleteError('At least one Coordinator must remain assigned to this election.');
      return;
    }

    try {
      onDeleteMember(memberToDelete.id);
      onShowToast('Team Member Removed', `Removed ${memberToDelete.name} from team.`, 'info');
      setMemberToDelete(null);
      setDeleteError(null);
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete team member';
      setDeleteError(msg);
      onShowToast('Error', msg, 'error');
    }
  };

  const handleRoleChange = (member: TeamMember, newRole: 'Organiser' | 'Coordinator') => {
    if (!isAuthorizedToManage) {
      onShowToast('Permission Denied', 'Organisers cannot change team permissions', 'error');
      return;
    }

    if (member.role === 'Coordinator' && newRole === 'Organiser' && coordinatorsCount <= 1) {
      onShowToast('Role Action Blocked', 'At least one Coordinator must remain assigned to this election.', 'error');
      return;
    }

    try {
      if (onUpdateMember) {
        onUpdateMember({
          id: member.id,
          role: newRole,
          department: newRole === 'Coordinator' ? 'Election Administration' : 'Event Operations'
        });
      }
      setEditingMemberId(null);
      onShowToast('Role Updated', `Updated ${member.name}'s role to ${newRole}`, 'success');
    } catch (err: any) {
      onShowToast('Error', err?.message || 'Failed to update role', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div
        className="rounded-3xl p-6 md:p-8 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl text-amber-500" style={{ backgroundColor: 'var(--amber-soft)' }}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                TEAM
              </h2>
              <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Manage the members who help organize and administer this TN Assembly election.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl text-amber-500 text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>Scoped to Selected Election</span>
        </div>
      </div>

      {/* 2. One-Time Credential Banner (after creation) */}
      {createdCredential && (
        <div className="rounded-3xl p-6 border-2 border-amber-500/50 bg-amber-950/20 text-white shadow-xl relative animate-slide-up space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-amber-400">Team Member Account Created</h4>
                <p className="text-xs text-slate-300">
                  Initial access code generated for <span className="font-bold text-white">{createdCredential.name}</span> ({createdCredential.email})
                </p>
              </div>
            </div>

            <button
              onClick={() => setCreatedCredential(null)}
              className="p-1.5 rounded-xl hover:bg-amber-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
            <div className="space-y-1 text-left w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Credential / Password</span>
              <div className="font-mono text-xl font-black text-amber-300 tracking-wider select-all">
                {createdCredential.accessCode}
              </div>
            </div>

            <button
              onClick={handleCopyCredentials}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
            >
              {copiedPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPass ? 'Copied!' : 'Copy Credentials'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This password is shown only once. Save it securely before leaving this page.</span>
          </div>
        </div>
      )}

      {/* 3. CURRENT TEAM SECTION */}
      <div
        className="rounded-3xl p-6 md:p-8 border shadow-sm space-y-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
          <div>
            <h3 className="text-lg md:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Current Team
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Assigned Organisers and Coordinators managing this election instance
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            {currentTeam.length} Member{currentTeam.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Empty State */}
        {currentTeam.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed space-y-3" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
              No team members added yet.
            </h4>
            <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Add Organisers or Coordinators who will manage this election.
            </p>
          </div>
        ) : (
          /* Members List Rows */
          <div className="space-y-3">
            {currentTeam.map((member) => {
              const isCoordinator = member.role === 'Coordinator';
              return (
                <div
                  key={member.id}
                  className="rounded-2xl p-4 md:p-5 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-amber-500/40"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                >
                  {/* Left: Person Icon, Name & Email */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      isCoordinator
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
                          {member.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email || 'No email specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Role Badge & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0 sm:justify-end">
                    
                    {/* Role Editing or Role Badge */}
                    {editingMemberId === member.id && isAuthorizedToManage ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member, e.target.value as any)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                        style={{ borderColor: 'var(--amber)' }}
                      >
                        <option value="Organiser">Organiser</option>
                        <option value="Coordinator">Coordinator</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                          isCoordinator
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {isCoordinator ? 'Coordinator' : 'Organiser'}
                        </span>

                        {isAuthorizedToManage && (
                          <button
                            onClick={() => setEditingMemberId(member.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Delete Action Button */}
                    {isAuthorizedToManage ? (
                      <button
                        onClick={() => {
                          setMemberToDelete(member);
                          setDeleteError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Delete Access</span>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ADD TEAM MEMBER SECTION */}
      {isAuthorizedToManage ? (
        <div
          className="rounded-3xl p-6 md:p-8 border shadow-sm space-y-6"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
            <h3 className="text-lg md:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Add a team member
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Provision Organiser or Coordinator access credentials for this election instance.
            </p>
          </div>

          {errors.general && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Arun Kumar"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  style={{ borderColor: errors.name ? 'var(--rose, #f43f5e)' : 'var(--border)' }}
                />
                {errors.name && <p className="text-xs font-bold text-rose-500">{errors.name}</p>}
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="e.g. arun@example.com"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  style={{ borderColor: errors.email ? 'var(--rose, #f43f5e)' : 'var(--border)' }}
                />
                {errors.email && <p className="text-xs font-bold text-rose-500">{errors.email}</p>}
              </div>

            </div>

            {/* Role Dropdown Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Assigned Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Organiser' | 'Coordinator')}
                className="w-full px-4 py-3 rounded-2xl text-sm font-bold border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="Organiser">Organiser</option>
                <option value="Coordinator">Coordinator</option>
              </select>
            </div>

            {/* 5. ROLE INFORMATION UI (Explanatory Permission Panel) */}
            <div className="rounded-2xl p-5 border bg-slate-950/40 border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-amber-400">
                <Info className="w-4 h-4 text-amber-400" />
                <span>{role} Permissions & Role Overview</span>
              </div>

              {role === 'Organiser' ? (
                <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                  <p className="font-bold text-amber-300 text-sm">Organiser</p>
                  <ul className="space-y-1 list-disc list-inside text-slate-300">
                    <li>Manage election operations</li>
                    <li>Manage assigned event activities</li>
                    <li>Manage voting/election workflow</li>
                    <li>View and manage permitted operational information</li>
                    <li className="text-rose-400 font-semibold">Cannot delete critical election data</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                  <p className="font-bold text-amber-300 text-sm">Coordinator</p>
                  <ul className="space-y-1 list-disc list-inside text-slate-300">
                    <li>All Organiser permissions</li>
                    <li>Manage team members</li>
                    <li>Delete applicable election/event records</li>
                    <li>Full administrative control over the election workflow</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Add Button */}
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl text-sm font-extrabold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-95 w-full sm:w-auto"
              style={{ backgroundColor: 'var(--amber)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="p-6 rounded-3xl border bg-slate-900/50 border-slate-800 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-extrabold text-white">Organiser Permission Restricted</h4>
          <p className="text-xs text-slate-400">
            You are signed in as an Organiser. Only Coordinators can add or delete team members for this election.
          </p>
        </div>
      )}

      {/* 9. DELETE CONFIRMATION MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-6 relative animate-scale-up"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Remove team member?
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  This member will lose access to this TN Assembly election.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-1">
              <p className="text-sm font-bold text-white">{memberToDelete.name}</p>
              <p className="text-xs text-slate-400">{memberToDelete.email} • Role: {memberToDelete.role}</p>
            </div>

            {/* Safeguard Last Coordinator Error Notice */}
            {deleteError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMemberToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 shadow-lg cursor-pointer transition-all active:scale-95"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
