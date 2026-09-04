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
  return role === 'super_admin' || role === 'coordinator' || role === 'volunteer';
}

/**
 * Checks if the user role can add new records.
 * All authorized management roles can add records.
 */
export function canAdd(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'coordinator' || role === 'volunteer';
}

/**
 * Checks if the user role can create/manage high-level events.
 * Restricted to Super Admin.
 */
export function canManageEvents(role?: UserRole): boolean {
  return role === 'super_admin';
}
