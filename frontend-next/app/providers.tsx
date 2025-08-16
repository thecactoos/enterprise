'use client';

import { useEffect, useRef } from 'react';
import { useUiStore, hydrateUiStore } from '../stores/ui-store';
import { AuthProvider } from '../components/auth-provider';
import { useHydration } from '../hooks/use-hydration';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const isHydrated = useHydration();
  const setTheme = useUiStore((state) => state.setTheme);
  const theme = useUiStore((state) => state.theme);
  
  // Use ref to prevent multiple hydrations
  const hasHydratedUi = useRef(false);

  // Hydrate UI store on client mount
  useEffect(() => {
    if (isHydrated && !hasHydratedUi.current) {
      hydrateUiStore();
      hasHydratedUi.current = true;
    }
  }, [isHydrated]);

  // Initialize theme on client side
  useEffect(() => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          document.documentElement.classList.toggle('dark', e.matches);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}