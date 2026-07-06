import {
  BarChart3,
  Layers,
  CalendarDays,
  FileText,
  LayoutGrid,
  MessageSquareText,
  Package,
  Palette,
  PartyPopper,
  Puzzle,
  Settings,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/api';

/**
 * ÚNICA fuente de verdad de la navegación. Sidebar (desktop), bottom nav
 * (móvil) y la página Menú consumen esta config filtrada por rol.
 *
 * Visibilidad según la matriz de roles del Documento Maestro (§ tabla roles):
 * - owner/admin: todo (admin no puede eliminar tenant, pero eso es a nivel acción)
 * - artist/guest: operación propia (agenda, clientes, su balance) — sin
 *   integraciones, equipo ni analytics
 * - receptionist: operacional (agenda, clientes, registrar pagos) — sin P&L,
 *   integraciones ni analytics
 * `soon: true` = existe en los mockups pero no en el backend → deshabilitado.
 */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  soon?: boolean;
}

const ALL: Role[] = ['owner', 'admin', 'artist', 'receptionist', 'guest'];
const STAFF: Role[] = ['owner', 'admin'];

/** Items principales — bottom nav en móvil, parte superior del sidebar. */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, roles: ALL },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ALL },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet, roles: ALL },
  { to: '/inventario', label: 'Inventario', icon: Package, roles: ALL, soon: true },
];

/** Items secundarios — resto del sidebar en desktop, página Menú en móvil. */
export const SECONDARY_NAV: NavItem[] = [
  { to: '/clientes', label: 'Clientes', icon: UsersRound, roles: ALL },
  { to: '/proyectos', label: 'Proyectos', icon: Layers, roles: ALL },
  { to: '/catalogo', label: 'Servicios', icon: Palette, roles: ALL },
  { to: '/formularios', label: 'Formularios', icon: FileText, roles: STAFF },
  { to: '/eventos', label: 'Eventos', icon: PartyPopper, roles: ALL },
  { to: '/equipo', label: 'Equipo', icon: Users, roles: STAFF },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: STAFF },
  { to: '/integraciones', label: 'Integraciones', icon: Puzzle, roles: STAFF },
  {
    to: '/comunicaciones',
    label: 'Comunicaciones',
    icon: MessageSquareText,
    roles: STAFF,
    soon: true,
  },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, roles: STAFF },
];

export function visibleItems(items: NavItem[], role: Role | undefined): NavItem[] {
  if (!role) return [];
  return items.filter((item) => item.roles.includes(role));
}
