import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, Tenant } from '@/types/api';

/**
 * Tenant activo, persistido en localStorage: al volver a la app el usuario
 * no re-elige estudio. El id NO es secreto (viaja en cada request como
 * X-Tenant-ID) y el backend valida la membership en cada request, así que
 * persistirlo no abre ningún bypass.
 */
export interface ActiveTenant {
  id: string;
  name: string;
  slug: string;
  role: Role;
}

interface TenantState {
  activeTenant: ActiveTenant | null;
  setActiveTenant: (tenant: Tenant, role: Role) => void;
  clearActiveTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenant: null,
      setActiveTenant: (tenant, role) =>
        set({
          activeTenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, role },
        }),
      clearActiveTenant: () => set({ activeTenant: null }),
    }),
    { name: 'tatudin.tenant' },
  ),
);
