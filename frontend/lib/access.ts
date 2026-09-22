export const ACCESS_KEY = 'mnf_access';
const ADMIN_KEY = 'mnf_user';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_KEY, token);
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ADMIN_KEY);
    return stored ? (JSON.parse(stored)?.token ?? null) : null;
  } catch {
    return null;
  }
}

export function clearAllTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function hasAccess(): boolean {
  return Boolean(getAdminToken() || getAccessToken());
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_KEY);
}
