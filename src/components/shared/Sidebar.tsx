import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { PRIMARY_NAV, SECONDARY_NAV, visibleItems, type NavItem } from '@/routes/nav';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';

function SidebarLink({ to, label, icon: Icon, soon }: NavItem) {
  if (soon) {
    return (
      <span className="text-muted-foreground/50 flex items-center gap-3 rounded-full px-4 py-2 text-sm">
        <Icon className="size-4.5" />
        <span className="flex-1">{label}</span>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          Soon
        </span>
      </span>
    );
  }
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-full px-4 py-2 text-sm transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground font-semibold'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )
      }
    >
      <Icon className="size-4.5" />
      {label}
    </NavLink>
  );
}

/** Sidebar fijo de desktop (oculto en móvil, donde manda el bottom nav). */
export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const role = activeTenant?.role;

  return (
    <aside className="bg-card fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r md:flex">
      <div className="px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight">Tatudin</h1>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {activeTenant?.name} · {user?.first_name || user?.email}
        </p>
      </div>
      <nav
        aria-label="Navegación principal"
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4"
      >
        {visibleItems(PRIMARY_NAV, role).map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
        <hr className="border-border my-3" />
        {visibleItems(SECONDARY_NAV, role).map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
