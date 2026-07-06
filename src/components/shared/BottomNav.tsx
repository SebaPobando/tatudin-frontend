import { Menu } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { PRIMARY_NAV, visibleItems } from '@/routes/nav';
import { useTenantStore } from '@/stores/tenant';

/**
 * Navegación inferior de los mockups (solo móvil): 4 secciones + Menú.
 * Los items "soon" se muestran deshabilitados, como en el mockup del drawer.
 */
export function BottomNav() {
  const role = useTenantStore((s) => s.activeTenant?.role);
  const items = visibleItems(PRIMARY_NAV, role);

  return (
    <nav
      aria-label="Navegación principal"
      className="bg-card fixed inset-x-0 bottom-0 z-20 border-t md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, soon }) => (
          <li key={to} className="flex-1">
            {soon ? (
              <span className="text-muted-foreground/50 flex flex-col items-center gap-1 py-2 text-[11px]">
                <Icon className="size-5" />
                {label}
              </span>
            ) : (
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2 text-[11px] transition-colors',
                    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            )}
          </li>
        ))}
        <li className="flex-1">
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 text-[11px] transition-colors',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
              )
            }
          >
            <Menu className="size-5" />
            Menú
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
