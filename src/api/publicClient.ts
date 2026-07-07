import axios from 'axios';

/**
 * Cliente para los endpoints PÚBLICOS (/api/public/...): sin Bearer, sin
 * X-Tenant-ID, sin refresh — el tenant viaja por slug en la URL y el backend
 * aplica throttle anónimo (30/min general, 10/h en submits de formularios).
 * Por eso NO reutilizamos la instancia `api` con sus interceptores: un
 * visitante externo no tiene (ni debe tener) sesión.
 */
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
