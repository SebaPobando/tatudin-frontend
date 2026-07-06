import { ChevronRight, LogOut, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/features/auth/hooks';
import { SECONDARY_NAV, visibleItems } from '@/routes/nav';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  artist: 'Artista',
  receptionist: 'Recepción',
  guest: 'Guest',
};

/**
 * Versión móvil del drawer lateral de los mockups: perfil arriba,
 * items secundarios según rol, items "soon" deshabilitados, y acciones
 * de sesión abajo. En desktop el sidebar ya muestra todo esto.
 */
export function MenuPage() {
  const user = useAuthStore((s) => s.user);
  const { activeTenant, clearActiveTenant } = useTenantStore();
  const logoutMutation = useLogout();
  const items = visibleItems(SECONDARY_NAV, activeTenant?.role);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">{user?.first_name || user?.email}</h2>
        <p className="text-muted-foreground text-sm">
          {activeTenant?.name} · {ROLE_LABEL[activeTenant?.role ?? ''] ?? activeTenant?.role}
        </p>
      </header>

      <ul className="bg-card divide-border divide-y rounded-lg border">
        {items.map(({ to, label, icon: Icon, soon }) => (
          <li key={to}>
            {soon ? (
              <span className="text-muted-foreground/50 flex items-center gap-3 px-4 py-3.5 text-sm">
                <Icon className="size-4.5" />
                <span className="flex-1">{label}</span>
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                  Soon
                </span>
              </span>
            ) : (
              <Link
                to={to}
                className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3.5 text-sm transition-colors"
              >
                <Icon className="size-4.5" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="text-muted-foreground size-4" />
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <Button variant="outline" className="rounded-full" onClick={clearActiveTenant}>
          <RefreshCcw /> Cambiar de estudio
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground rounded-full"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut /> Cerrar sesión
        </Button>
      </div>
    </main>
  );
}
