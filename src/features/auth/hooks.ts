import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { forceLogout, refreshAccessToken } from '@/api/refresh';
import { getRefreshToken, setRefreshToken } from '@/lib/token-storage';
import { useAuthStore } from '@/stores/auth';
import * as authApi from './api';

/**
 * Restaura la sesión al cargar la app: si hay refresh token en
 * sessionStorage, pide un access nuevo y trae el user de /api/me/.
 * Mientras tanto status queda en 'unknown' y RequireAuth muestra el splash.
 */
export function useAuthBootstrap() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'unknown') return;
    const { setSession, setUnauthenticated } = useAuthStore.getState();

    if (!getRefreshToken()) {
      setUnauthenticated();
      return;
    }
    (async () => {
      try {
        const access = await refreshAccessToken();
        const user = await authApi.getMe();
        setSession(access, user);
      } catch {
        forceLogout();
      }
    })();
  }, [status]);

  return status;
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setRefreshToken(data.refresh);
      useAuthStore.getState().setSession(data.access, data.user);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const refresh = getRefreshToken();
      // Blacklistear el refresh en el backend; si falla igual cerramos local.
      if (refresh) await authApi.logout(refresh).catch(() => {});
    },
    onSettled: () => {
      forceLogout();
    },
  });
}

export function useMemberships(enabled = true) {
  return useQuery({
    queryKey: ['memberships'],
    queryFn: authApi.getMemberships,
    enabled,
  });
}
