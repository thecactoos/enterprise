'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, hydrateAuthStore } from '../stores/auth-store';
import { useHydration } from '../hooks/use-hydration';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isHydrated = useHydration();
  const hasInitialized = useRef(false);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Hydrate the auth store on client mount
  useEffect(() => {
    if (isHydrated && !hasInitialized.current) {
      hydrateAuthStore();
      hasInitialized.current = true;
    }
  }, [isHydrated]);

  // Initialize auth after hydration
  useEffect(() => {
    if (isHydrated && hasInitialized.current && !isInitialized) {
      initializeAuth();
    }
  }, [isHydrated, initializeAuth, isInitialized]);

  return <>{children}</>;
}