import { create } from 'zustand';
import type { User } from '@/types/api';
import { clearRefreshToken } from '@/lib/token-storage';

/**
 * status:
 * - 'unknown': la app acaba de cargar; aún no sabemos si hay sesión restaurable.
 * - 'authenticated' / 'unauthenticated': estados finales.
 *
 * El access token vive SOLO aquí (memoria). Al recargar la página se pierde,
 * y useAuthBootstrap lo recupera usando el refresh de sessionStorage.
 */
interface AuthState {
  status: 'unknown' | 'authenticated' | 'unauthenticated';
  accessToken: string | null;
  user: User | null;
  setSession: (accessToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  setUnauthenticated: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'unknown',
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ status: 'authenticated', accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUnauthenticated: () => set({ status: 'unauthenticated', accessToken: null, user: null }),
  clearSession: () => {
    clearRefreshToken();
    set({ status: 'unauthenticated', accessToken: null, user: null });
  },
}));
