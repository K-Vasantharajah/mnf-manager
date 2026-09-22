import axios from 'axios';
import { clearAllTokens, getAccessToken, getAdminToken } from './access';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  // Admin token takes priority: it grants everything a member token does, plus writes
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
    // A wrong code or failed Google sign-in also returns 401; those are handled on the page itself
    const isAuthRequest = url.includes('/api/v1/access') || url.includes('/api/v1/auth');

    if (status === 401 && !isAuthRequest && typeof window !== 'undefined') {
      clearAllTokens();
      if (!window.location.pathname.startsWith('/access')) {
        window.location.href = '/access';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
