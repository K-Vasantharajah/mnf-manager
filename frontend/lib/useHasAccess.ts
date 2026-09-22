import { useSyncExternalStore } from 'react';
import { hasAccess } from './access';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/** true/false in the browser; null during server rendering, before we can check */
export function useHasAccess(): boolean | null {
  return useSyncExternalStore(subscribe, hasAccess, () => null);
}
