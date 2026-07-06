import axios, { type InternalAxiosRequestConfig } from 'axios';
import { isExpiringSoon } from '@/lib/jwt';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { forceLogout, refreshAccessToken } from './refresh';

/**
 * Instancia central de axios. TODA llamada al backend pasa por aquí para
 * cumplir dos reglas del integration guide:
 * 1. "Defensive coding sobre X-Tenant-ID": el header se inyecta SIEMPRE que
 *    haya tenant activo — ninguna feature tiene que acordarse de ponerlo.
 * 2. Refresh proactivo: si el access expira en <2 min, se refresca ANTES de
 *    la request (evita el 401 y la condición de carrera del refresh reactivo).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

/** Endpoints que no llevan Authorization (login/refresh/logout van sin Bearer). */
const AUTH_PATHS = ['/api/auth/token/', '/api/auth/token/refresh/', '/api/auth/logout/'];

function isAuthPath(url: string | undefined): boolean {
  return AUTH_PATHS.some((p) => (url ?? '').startsWith(p));
}

api.interceptors.request.use(async (config) => {
  if (isAuthPath(config.url)) return config;

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    let token = accessToken;
    if (isExpiringSoon(token)) {
      try {
        token = await refreshAccessToken();
      } catch {
        forceLogout();
        throw new axios.Cancel('Sesión expirada');
      }
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Header en lowercase exacto: el backend whitelistea 'x-tenant-id' en CORS.
  const tenantId = useTenantStore.getState().activeTenant?.id;
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Red de seguridad reactiva: si a pesar del refresh proactivo llega un 401
 * (ej. token revocado server-side), intenta UN refresh y reintenta la
 * request original. Si el refresh también falla, la sesión murió → logout.
 */
api.interceptors.response.use(undefined, async (error) => {
  const original = error.config as RetriableConfig | undefined;
  const status = error.response?.status;

  if (status === 401 && original && !original._retry && !isAuthPath(original.url)) {
    original._retry = true;
    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      forceLogout();
    }
  }

  throw error;
});
