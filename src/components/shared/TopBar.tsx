import { Bell } from 'lucide-react';
import { useTenantStore } from '@/stores/tenant';

/** Barra superior móvil, como en los mockups: logo + campana. */
export function TopBar() {
  const activeTenant = useTenantStore((s) => s.activeTenant);

  return (
    <header className="flex items-center justify-between px-6 pt-5 pb-1 md:hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tatudin</h1>
        <p className="text-muted-foreground truncate text-xs">{activeTenant?.name}</p>
      </div>
      <button
        type="button"
        aria-label="Notificaciones"
        className="text-foreground hover:bg-accent rounded-full p-2 transition-colors"
      >
        <Bell className="size-5" />
      </button>
    </header>
  );
}
