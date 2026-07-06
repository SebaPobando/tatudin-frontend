import axios from 'axios';
import type { RefreshResponse } from '@/types/api';
import { getRefreshToken, setRefreshToken } from '@/lib/token-storage';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';

/**
 * Refresh "single-flight": si N requests concurrentes necesitan refrescar,
 * solo se dispara UNA llamada a /token/refresh/ y todas esperan la misma
 * promesa. Crítico porque el backend ROTA el refresh token: dos refreshes
 * en paralelo harían que el segundo use un token ya blacklisteado → logout
 * forzado (pitfall #4 y #5 del integration guide).
 *
 * Usa un axios "crudo" (no la instancia `api`) para no pasar por los
 * interceptores y evitar recursión.
 */
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('NO_REFRESH_TOKEN');
  }
  const { data } = await axios.post<RefreshResponse>(
    `${import.meta.env.VITE_API_BASE_URL}/api/auth/token/refresh/`,
    { refresh },
  );
  // Rotación: el refresh viejo quedó blacklisteado. Guardar SIEMPRE el nuevo.
  setRefreshToken(data.refresh);
  useAuthStore.getState().setAccessToken(data.access);
  return data.access;
}

/** Limpia toda la sesión (auth + tenant). RequireAuth redirige solo al ver el cambio. */
export function forceLogout(): void {
  useAuthStore.getState().clearSession();
  useTenantStore.getState().clearActiveTenant();
}
