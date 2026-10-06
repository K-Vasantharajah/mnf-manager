import axios from 'axios';
import { ADMIN_KEY, clearAllTokens } from './access';

/** Must match the subject the demo backend puts in its tokens. */
export const DEMO_EMAIL = 'demo@mnfmanager.app';

export const DEMO_API_URL = process.env.NEXT_PUBLIC_DEMO_API_URL;

export function demoAvailable(): boolean {
  return Boolean(DEMO_API_URL);
}

/**
 * Demo mode is decided by who is signed in, not by a separate flag, so signing
 * out or entering the real access code always ends it.
 */
export function isDemo(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) ?? 'null')?.email === DEMO_EMAIL;
  } catch {
    return false;
  }
}

/** Wakes the demo backend (which reseeds itself) and signs in as the demo admin. */
export async function enterDemo(): Promise<void> {
  if (!DEMO_API_URL) throw new Error('Demo is not configured');

  // Plain axios, not the app's client: no stored token should be sent here
  const { data } = await axios.post(`${DEMO_API_URL}/api/v1/demo/enter`);

  clearAllTokens();
  localStorage.setItem(
    ADMIN_KEY,
    JSON.stringify({
      email: DEMO_EMAIL,
      name: 'Demo visitor',
      picture: '',
      role: 'ADMIN',
      token: data.token,
    })
  );

  // A full reload, not router.push: it clears React Query's cache, so no real
  // data survives into the demo
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = '/dashboard';
}

export function exitDemo(): void {
  clearAllTokens();
  // A full reload, for the same reason as enterDemo: no demo data survives
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = '/access';
}
