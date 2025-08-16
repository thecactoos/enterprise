'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to safely handle client-side hydration
 * Prevents hydration mismatches by waiting for client mount
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This will only run on the client
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook that returns a safe value only after hydration
 * Returns fallback value during SSR/hydration
 */
export function useHydratedValue<T>(value: T, fallback: T): T {
  const isHydrated = useHydration();
  return isHydrated ? value : fallback;
}