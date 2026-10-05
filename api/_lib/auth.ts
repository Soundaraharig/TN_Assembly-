// api/_lib/auth.ts
// Secure token generation and verification for TN Assembly coordinator/admin sessions

export interface SessionTokenPayload {
  sub: string;            // coordinator_id
  email: string;
  name: string;
  role: 'coordinator' | 'super_admin';
  eventId: string;        // Authorized event ID or '*' for super_admin
  exp: number;            // Expiration timestamp in seconds
  iat: number;            // Issued-at timestamp in seconds
}

const DEFAULT_SECRET = 'tn_assembly_secret_sign_v1_fallback_change_in_prod';

function getSecretKey(): string {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SECRET;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

export async function createSessionToken(payload: Omit<SessionTokenPayload, 'exp' | 'iat'>, expiresInSeconds: number = 86400): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binaryStr = '';
  for (let i = 0; i < signatureBytes.length; i++) {
    binaryStr += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = base64UrlEncode(binaryStr);

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifySessionToken(token: string): Promise<{ valid: boolean; payload?: SessionTokenPayload; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSecretKey()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigStr = base64UrlDecode(encodedSignature);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataToSign));
    if (!isValid) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload: SessionTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Token verification failed' };
  }
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
