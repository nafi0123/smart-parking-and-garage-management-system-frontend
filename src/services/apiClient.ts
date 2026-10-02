import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearAuthSession, getAuthToken } from '@/utils/cookie';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isVercelOrRemote =
      window.location.hostname.includes('vercel.app') ||
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    if (isVercelOrRemote) {
      return (
        process.env.NEXT_PUBLIC_BASE_API?.startsWith('https')
          ? process.env.NEXT_PUBLIC_BASE_API
          : 'https://smart-parking-backend-omega.vercel.app/api/v1'
      );
    }
  }

  return process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

let isRedirecting = false;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach dynamic BaseURL & Bearer Token from Cookie
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Automatically handle 401/403 Unauthorized & trigger logout
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError<any>) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const url = error.config?.url || '';
      const method = error.config?.method?.toLowerCase() || 'get';

      // Don't trigger auto-logout on public GET endpoints (like /garages, /garages/nearby)
      const isPublicGet =
        method === 'get' && (url.startsWith('/garages') || url.startsWith('garages'));

      if ((status === 401 || status === 403) && !isRedirecting && !isPublicGet) {
        isRedirecting = true;

        try {
          // Fire-and-forget backend logout API to clear server cookies
          await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
        } catch {
          // ignore network error
        } finally {
          // Clear all cookies completely
          clearAuthSession();

          const path = window.location.pathname;
          if (
            !path.startsWith('/login') &&
            !path.startsWith('/register') &&
            !path.startsWith('/verify-otp')
          ) {
            window.location.replace('/login');
          } else {
            isRedirecting = false;
          }
        }
      }
    }

    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    const customError = new Error(errorMessage);
    Object.assign(customError, {
      success: false,
      statusCode: error.response?.status || 500,
      data: error.response?.data?.data || null,
      errorSources: error.response?.data?.errorSources,
    });

    return Promise.reject(customError);
  },
);

export default apiClient;
