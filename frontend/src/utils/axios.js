import axios from 'axios';

// Same-origin "/api" by default (Vercel, Render single service). Set VITE_API_URL when the API is hosted elsewhere.
const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (userInfo?.token) config.headers.Authorization = `Bearer ${userInfo.token}`;
  } catch {
    localStorage.removeItem('userInfo');
  }
  return config;
});

/** Turns any axios error into one short sentence a farmer can act on. */
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.code === 'ECONNABORTED') return 'The server took too long to answer. Please check your internet and try again.';
  if (!error?.response) return navigator.onLine === false ? 'You are offline. Please check your internet connection.' : 'Could not reach the server. Please try again in a moment.';
  return error.response.data?.message || fallback;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthCall = /\/auth\/(login|register)$/.test(error.config?.url || '');

    if (status === 401 && !isAuthCall) {
      localStorage.removeItem('userInfo');
      window.dispatchEvent(new Event('auth-expired'));
      if (!window.location.pathname.startsWith('/login')) {
        const next = encodeURIComponent(window.location.pathname);
        window.location.assign(`/login?expired=1&next=${next}`);
      }
      return Promise.reject(error);
    }

    // Pages that show their own inline error pass { silent: true }.
    if (!error.config?.silent && !isAuthCall) {
      window.dispatchEvent(new CustomEvent('app-notify', { detail: { message: errorMessage(error), type: 'error' } }));
    }
    return Promise.reject(error);
  }
);

export default api;
