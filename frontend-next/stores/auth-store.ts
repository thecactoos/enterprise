import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (data: { user: User; accessToken: string; refreshToken?: string }) => void;
  logout: () => void;
  clearAuth: () => void;
  initialize: () => void;
}

// Create the store with persist middleware for SSR compatibility
export const useAuthStore = create<AuthState>()((
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
      
      initialize: () => {
        // Skip initialization if already done or on server
        if (typeof window === 'undefined') {
          set({ isInitialized: true });
          return;
        }
        
        const state = get();
        if (state.isInitialized) return;
        
        // The persist middleware will handle the localStorage loading
        // We just need to update the auth state based on stored data
        const hasValidAuth = state.accessToken && 
                            state.user && 
                            state.accessToken !== 'undefined' && 
                            state.accessToken !== 'null';
        
        set({
          isAuthenticated: hasValidAuth,
          isInitialized: true,
        });
      },
  
      setAuth: ({ user, accessToken, refreshToken }) => {
        console.log('Setting auth');
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        });
        
        // Set cookie for middleware (persist middleware handles localStorage)
        if (typeof window !== 'undefined') {
          document.cookie = `crm_token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
      },
  
      logout: () => {
        console.log('Logging out');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        });
        
        // Clear cookies (persist middleware handles localStorage clearing)
        if (typeof window !== 'undefined') {
          document.cookie = 'crm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      },
      
      clearAuth: () => {
        // Same as logout but without logging
        const { logout } = get();
        logout();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Use a safe storage that handles SSR
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // Handle hydration to prevent mismatches
      skipHydration: true,
    }
  )
));

// SSR-safe selectors
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.accessToken);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAuthInitialized = () => useAuthStore((state) => state.isInitialized);

// Hydration helper - call this on the client side
export const hydrateAuthStore = () => {
  if (typeof window !== 'undefined') {
    useAuthStore.persist.rehydrate();
  }
};

// Note: Initialization is now handled in the Providers component
// to prevent multiple initializations and useEffect loops