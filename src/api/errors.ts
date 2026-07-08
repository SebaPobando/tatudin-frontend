import { isAxiosError } from 'axios';

/**
 * Traduce el formato de errores de DRF a un mensaje mostrable.
 * Formatos posibles (ver docs/FRONTEND_INTEGRATION.md):
 * - { detail: "mensaje" }                        → general / 401 / 403 / 429
 * - { campo: ["error 1", "error 2"] }            → validación 400
 * - { campo: "error" }                           → errores de service layer
 * - { detail, request_id }                       → 500 (mostrar request_id)
 */
export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return 'Ocurrió un error inesperado.';
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
  }

  const data: unknown = error.response.data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (typeof record.detail === 'string') {
      // 500 con request_id: incluirlo para que el user pueda reportarlo
      if (typeof record.request_id === 'string') {
        return `${record.detail} Si reportas este error, incluye el código ${record.request_id}.`;
      }
      return record.detail;
    }

    // Errores de campo: mostrar el primero de forma legible
    for (const [field, value] of Object.entries(record)) {
      const message = Array.isArray(value) ? value[0] : value;
      if (typeof message === 'string') {
        return field === 'non_field_errors' ? message : `${field}: ${message}`;
      }
    }
  }

  return `Error ${error.response.status} del servidor.`;
}

/**
 * Extrae el X-Request-ID de un error para correlación con los logs del backend.
 * Lo busca en el header `x-request-id` (presente en TODA respuesta de error) y,
 * como respaldo, en el body de los 500 (`request_id`). Devuelve null si no hay.
 */
export function getRequestId(error: unknown): string | null {
  if (!isAxiosError(error) || !error.response) return null;
  const header = error.response.headers?.['x-request-id'];
  if (typeof header === 'string' && header) return header;
  const data: unknown = error.response.data;
  if (data && typeof data === 'object') {
    const id = (data as Record<string, unknown>).request_id;
    if (typeof id === 'string' && id) return id;
  }
  return null;
}
