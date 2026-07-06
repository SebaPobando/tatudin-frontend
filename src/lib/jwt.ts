/**
 * Decodifica el payload de un JWT SIN verificar la firma (verificar es trabajo
 * del backend). Solo lo usamos para leer `exp` y refrescar proactivamente
 * antes de que el access token (15 min) expire — el pitfall #5 del guide:
 * refrescar solo al recibir 401 genera condiciones de carrera con requests
 * concurrentes.
 */
export function getJwtExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

/** true si el token expira en menos de `marginSeconds` (default 2 min). */
export function isExpiringSoon(token: string, marginSeconds = 120): boolean {
  const exp = getJwtExpiration(token);
  if (exp === null) return true;
  return exp * 1000 - Date.now() < marginSeconds * 1000;
}
