import axios from 'axios';
import { clearAllTokens, getAccessToken, getAdminToken, clearAdminToken } from './access';
import { DEMO_API_URL, exitDemo, isDemo } from './demo';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  if (isDemo() && DEMO_API_URL) {
    config.baseURL = DEMO_API_URL;
  }
  const token = getAdminToken() ?? getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const isAuthRequest = url.includes('/api/v1/access') || url.includes('/api/v1/auth');

    if (status === 401 && !isAuthRequest && typeof window !== 'undefined') {
      if (isDemo()) {
        // Demo tokens last 12 hours; when one expires, start again from the access page
        exitDemo();
        return Promise.reject(error);
      }
      if (getAdminToken()) {
        clearAdminToken();
      } else {
        clearAllTokens();
        if (!window.location.pathname.startsWith('/access')) {
          // Not inside a component, so no router available; a full reload also clears cached data
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = '/access';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
