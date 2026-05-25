'use client';

import { useLayoutEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { setBackendAuthGetter } from '@/lib/api/http';

/**
 * Wires Clerk session JWT into axios for the REST API. Must run before any apiClient call.
 * useLayoutEffect runs before child useEffect, but components should still wait for isLoaded
 * before firing requests so getToken() always resolves a session token.
 */
export function BackendAuthRegistrar() {
  const { getToken, isLoaded } = useAuth();

  useLayoutEffect(() => {
    setBackendAuthGetter(async () => {
      try {
        if (!isLoaded) return null;
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });
  }, [getToken, isLoaded]);

  return null;
}
