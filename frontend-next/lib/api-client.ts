import axios, { AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY } from './constants';

// Axios jest tylko "fetcherem" - React Query zarządza stanem
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility to validate JWT token format
const isValidJWT = (token: string | null | undefined): token is string => {
  if (!token || typeof token !== 'string' || token === 'undefined' || token === 'null') {
    return false;
  }
  // Basic JWT format validation (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Request interceptor - dodaje token do każdego requestu
apiClient.interceptors.request.use(
  (config) => {
    // Try localStorage first (for client-side)
    let token = localStorage.getItem(TOKEN_KEY);
    
    // Validate token from localStorage
    if (!isValidJWT(token)) {
      token = null;
    }
    
    // If not valid in localStorage, try cookies (for SSR/middleware)
    if (!token && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('crm_token=')
      );
      if (tokenCookie) {
        const cookieToken = tokenCookie.split('=')[1];
        if (isValidJWT(cookieToken)) {
          token = cookieToken;
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 API request with valid token:', { 
        url: config.url, 
        method: config.method,
        hasAuth: true,
        tokenPrefix: token.slice(0, 20) + '...'
      });
    } else {
      console.log('❌ API request without token:', { 
        url: config.url, 
        method: config.method,
        hasAuth: false,
        localStorageToken: localStorage.getItem(TOKEN_KEY) ? 'exists but invalid' : 'not found'
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - obsługa błędów i refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (isValidJWT(refreshToken)) {
          // TODO: Implement refresh token logic
          // const { data } = await apiClient.post('/auth/refresh', { refreshToken });
          // localStorage.setItem(TOKEN_KEY, data.accessToken);
          // return apiClient(originalRequest);
          console.log('Would attempt token refresh, but not implemented yet');
        } else {
          console.log('No valid refresh token available');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Clear invalid auth data and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('auth-storage');
      window.location.href = '/auth/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;