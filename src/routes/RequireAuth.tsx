import { Navigate, Outlet } from 'react-router';
import { useAuthBootstrap } from '@/features/auth/hooks';
import { useTenantStore } from '@/stores/tenant';

/** Splash mientras intentamos restaurar la sesión (status 'unknown'). */
function SessionSplash() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p className="text-muted-foreground animate-pulse text-sm">Cargando Tatudin…</p>
    </main>
  );
}

/**
 * Guard de rutas privadas. Dos niveles:
 * - requireTenant=false → basta estar autenticado (ej. /select-tenant)
 * - requireTenant=true  → además debe haber tenant activo (todo lo demás)
 *
 * Es un componente reactivo: si forceLogout() limpia el store en cualquier
 * momento (refresh muerto, 401 irrecuperable), esto re-renderiza y redirige
 * a /login sin necesidad de navegación imperativa desde los interceptores.
 */
export function RequireAuth({ requireTenant = true }: { requireTenant?: boolean }) {
  const status = useAuthBootstrap();
  const activeTenant = useTenantStore((s) => s.activeTenant);

  if (status === 'unknown') return <SessionSplash />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (requireTenant && !activeTenant) return <Navigate to="/select-tenant" replace />;

  return <Outlet />;
}
