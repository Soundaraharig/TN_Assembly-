// src/services/adminApiService.ts
// Client-side helper for invoking authenticated server-side administrative endpoints

const TOKEN_KEY = 'tn_assembly_session_token';

class AdminApiService {
  private inMemoryToken: string | null = null;

  public setSessionToken(token: string | null): void {
    this.inMemoryToken = token;
    try {
      if (typeof window !== 'undefined') {
        if (token) {
          sessionStorage.setItem(TOKEN_KEY, token);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch {}
  }

  public getSessionToken(): string | null {
    if (this.inMemoryToken) return this.inMemoryToken;
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        if (stored) {
          this.inMemoryToken = stored;
          return stored;
        }
      }
    } catch {}
    return null;
  }

  public clearSession(): void {
    this.inMemoryToken = null;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  }

  public async invokeAdminAction(
    action: string,
    eventId: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; handledByServer: boolean; error?: any; data?: any }> {
    const token = this.getSessionToken();
    if (!token) {
      return { success: false, handledByServer: false, error: 'No server session token available' };
    }

    try {
      const response = await fetch('/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, eventId, payload })
      });

      if (response.status === 404 || response.status === 405) {
        // API endpoint not deployed or not reachable -> signal fallback
        return { success: false, handledByServer: false };
      }

      const data = await response.json();
      if (!response.ok) {
        return { success: false, handledByServer: true, error: data?.error || `HTTP ${response.status}` };
      }

      return { success: true, handledByServer: true, data };
    } catch (err: any) {
      console.warn('[AdminApiService] Network error calling /api/admin/action:', err?.message);
      return { success: false, handledByServer: false, error: err };
    }
  }

  public async loginCoordinator(
    email: string,
    password: string,
    eventId?: string
  ): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const response = await fetch('/api/auth/coordinator-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, eventId })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data?.error || `Login failed (HTTP ${response.status})` };
      }

      const data = await response.json();
      if (data.token) {
        this.setSessionToken(data.token);
      }
      return { success: true, token: data.token, user: data.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login network error' };
    }
  }
}

export const adminApiService = new AdminApiService();
