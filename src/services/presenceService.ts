import { supabase, isSupabaseEnabled } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  userId: string;
  name: string;
  role: 'student' | 'volunteer' | 'jury' | 'coordinator' | 'organiser' | 'super_admin' | 'admin';
  accessCode?: string | null;
  onlineAt: string;
}

export type PresenceListener = (activeKeys: Set<string>, activeUsers: Map<string, PresenceUser>) => void;

class PresenceService {
  private currentChannel: RealtimeChannel | null = null;
  private currentEventId: string | null = null;
  private currentUser: PresenceUser | null = null;
  private activeUsers: Map<string, PresenceUser> = new Map();
  private activeKeys: Set<string> = new Set();
  private listeners: Set<PresenceListener> = new Set();
  private isTracking: boolean = false;
  private leavePromise: Promise<void> | null = null;

  /**
   * Subscribe to presence updates. Immediately invokes listener with current state.
   */
  public subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    try {
      listener(new Set(this.activeKeys), new Map(this.activeUsers));
    } catch (err) {
      console.error('[PresenceService] Initial subscriber error:', err);
    }
    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const keysCopy = new Set(this.activeKeys);
    const usersCopy = new Map(this.activeUsers);
    this.listeners.forEach(fn => {
      try {
        fn(keysCopy, usersCopy);
      } catch (err) {
        console.error('[PresenceService] Listener error:', err);
      }
    });
  }

  /**
   * Check if a user is currently online by their database ID or access code (case-insensitive).
   */
  public isOnline(idOrCode?: string | null): boolean {
    if (!idOrCode) return false;
    const clean = idOrCode.trim();
    return this.activeKeys.has(clean) || this.activeKeys.has(clean.toUpperCase());
  }

  /**
   * Get all currently active users in the event presence room.
   */
  public getActiveUsers(): Map<string, PresenceUser> {
    return new Map(this.activeUsers);
  }

  /**
   * Get count of currently active users in the room.
   */
  public getActiveCount(): number {
    return this.activeUsers.size;
  }

  /**
   * Join and track active presence in the event's presence room.
   * 100% Zero-Egress WebSocket channel — no periodic DB heartbeats.
   */
  public async join(eventId: string, user: PresenceUser): Promise<void> {
    if (!supabase || !isSupabaseEnabled) {
      // Local-only mode: mark self as active
      this.currentEventId = eventId;
      this.currentUser = user;
      this.activeUsers.set(user.userId, user);
      this.activeKeys.add(user.userId);
      if (user.accessCode) this.activeKeys.add(user.accessCode.trim().toUpperCase());
      this.notify();
      return;
    }

    if (!eventId || !user || !user.userId) return;

    // If already tracking this exact event and user on an active channel, skip recreation
    if (
      this.currentChannel &&
      this.currentEventId === eventId &&
      this.currentUser?.userId === user.userId
    ) {
      return;
    }

    // Leave any previous presence room
    await this.leave();

    this.currentEventId = eventId;
    this.currentUser = user;

    const channelName = `presence:event_${eventId}`;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Realtime] channel created: ${channelName}`);
      console.log(`[Realtime] Active channels: ${supabase.getChannels().length}`);
    }

    const room = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.userId
        }
      }
    });

    this.currentChannel = room;

    // Only coordinator/volunteer/admin roles need to listen to full presence state syncs
    const needsPresenceDisplay = user.role === 'coordinator' || user.role === 'volunteer' || user.role === 'organiser' || user.role === 'super_admin' || user.role === 'admin';
    if (needsPresenceDisplay) {
      room
        .on('presence', { event: 'sync' }, () => {
          this.parsePresenceState();
        })
        .on('presence', { event: 'join' }, () => {
          this.parsePresenceState();
        })
        .on('presence', { event: 'leave' }, () => {
          this.parsePresenceState();
        });
    }

    room.subscribe(async (status: string) => {
      // Ignore if another channel was created or leave() was called in the interim
      if (this.currentChannel !== room) return;

      if (status === 'SUBSCRIBED') {
        try {
          await room.track({
            userId: user.userId,
            name: user.name,
            role: user.role,
            accessCode: user.accessCode || null,
            onlineAt: new Date().toISOString()
          });
          if (this.currentChannel === room) {
            this.isTracking = true;
            if (needsPresenceDisplay) {
              this.parsePresenceState();
            }
          }
        } catch (err) {
          console.warn('[PresenceService] Error tracking presence:', err);
        }
      }
    });
  }

  /**
   * Parse the Supabase presence state and update local lookup Sets & Maps.
   */
  private parsePresenceState() {
    if (!this.currentChannel) return;

    try {
      const state = this.currentChannel.presenceState();
      const nextUsers = new Map<string, PresenceUser>();
      const nextKeys = new Set<string>();

      Object.keys(state).forEach(key => {
        const presences = state[key];
        if (Array.isArray(presences) && presences.length > 0) {
          const p = presences[0] as unknown as PresenceUser;
          if (p?.userId) {
            nextUsers.set(p.userId, p);
            nextKeys.add(p.userId);
            if (p.accessCode) {
              nextKeys.add(p.accessCode.trim().toUpperCase());
            }
          }
        }
      });

      // Always ensure current user is marked active if channel is connected
      if (this.currentUser) {
        nextUsers.set(this.currentUser.userId, this.currentUser);
        nextKeys.add(this.currentUser.userId);
        if (this.currentUser.accessCode) {
          nextKeys.add(this.currentUser.accessCode.trim().toUpperCase());
        }
      }

      this.activeUsers = nextUsers;
      this.activeKeys = nextKeys;
      this.notify();
    } catch (err) {
      console.warn('[PresenceService] parsePresenceState error:', err);
    }
  }

  /**
   * Leave presence and cleanup channel on logout or unmount.
   * Fully idempotent, atomic, and safe against concurrent calls / React StrictMode.
   */
  public async leave(): Promise<void> {
    if (this.leavePromise) {
      return this.leavePromise;
    }

    // Atomically detach channel reference synchronously so no concurrent caller can access it
    const channelToLeave = this.currentChannel;
    const wasTracking = this.isTracking;
    this.currentChannel = null;
    this.currentEventId = null;
    this.currentUser = null;
    this.isTracking = false;
    this.activeUsers.clear();
    this.activeKeys.clear();
    this.notify();

    if (!channelToLeave) {
      return;
    }

    this.leavePromise = (async () => {
      try {
        if (wasTracking) {
          try {
            await channelToLeave.untrack();
          } catch {
            // Untrack can fail if socket is already closed or closing
          }
        }

        if (supabase && channelToLeave && typeof channelToLeave.unsubscribe === 'function') {
          const topic = channelToLeave.topic || 'presence';
          try {
            await supabase.removeChannel(channelToLeave);
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[Realtime] channel removed: ${topic}`);
              console.log(`[Realtime] Active channels: ${supabase.getChannels().length}`);
            }
          } catch (remErr) {
            console.warn('[PresenceService] removeChannel error handled safely:', remErr);
          }
        }
      } catch (err) {
        console.warn('[PresenceService] Error leaving presence channel safely:', err);
      } finally {
        this.leavePromise = null;
      }
    })();

    return this.leavePromise;
  }
}

export const presenceService = new PresenceService();
