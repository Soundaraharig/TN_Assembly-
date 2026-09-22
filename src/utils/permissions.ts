import type { UserRole } from '../types';

/**
 * Checks if the current user role has permission to delete data
 * (participants, parties, committees, jury, volunteers, checklist items, nominations, etc.).
 *
 * Super Admin: Full delete access.
 * Coordinator: Full delete access for assigned event.
 * Yuva Organiser / Volunteer: Prohibited from deleting data.
 */
export function canDelete(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator';
}

/**
 * Checks if the user role can modify / edit data.
 * All authorized management roles (super_admin, coordinator, volunteer/yuva) can modify data.
 */
export function canModify(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator' || role === 'volunteer' || role === 'organiser';
}

/**
 * Checks if the user role can add new records.
 * All authorized management roles can add records.
 */
export function canAdd(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator' || role === 'volunteer' || role === 'organiser';
}

/**
 * Checks if the user role can create/manage high-level events.
 * Restricted to Super Admin.
 */
export function canManageEvents(role?: UserRole): boolean {
  return role === 'super_admin';
}

/**
 * Checks if the user role can manage team members (add, delete, or change roles).
 * Coordinator and Super Admin have full management capabilities.
 * Organiser is restricted from managing team members.
 */
export function canManageTeam(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator';
}

/**
 * Checks if the user role can use session/bulk attendance controls
 * (Mark FN Present, Mark AN Present, Mark Both Present, Reset Absent).
 * Restricted strictly to Super Admin, Admin, and Coordinator roles.
 * Volunteers, Students, Jury, and Organisers are prohibited.
 */
export function canManageSessionAttendance(role?: UserRole | string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return normalized === 'super_admin' || normalized === 'admin' || normalized === 'coordinator';
}
