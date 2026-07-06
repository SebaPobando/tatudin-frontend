/**
 * El refresh token vive en sessionStorage (recomendación del integration guide
 * cuando no hay httpOnly cookie): sobrevive recargas de página pero no
 * persiste al cerrar la pestaña. El ACCESS token nunca se persiste — vive
 * solo en memoria (store de Zustand), lo que reduce la superficie de XSS.
 */
const REFRESH_KEY = 'tatudin.refresh';

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  sessionStorage.setItem(REFRESH_KEY, token);
}

export function clearRefreshToken(): void {
  sessionStorage.removeItem(REFRESH_KEY);
}
