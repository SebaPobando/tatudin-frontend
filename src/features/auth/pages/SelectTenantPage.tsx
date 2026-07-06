import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import type { Membership } from '@/types/api';
import { useLogout, useMemberships } from '../hooks';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  artist: 'Artista',
  receptionist: 'Recepción',
  guest: 'Guest',
};

export function SelectTenantPage() {
  const navigate = useNavigate();
  const { data: memberships, isPending, isError, error } = useMemberships();
  const setActiveTenant = useTenantStore((s) => s.setActiveTenant);
  const logoutMutation = useLogout();

  const select = (m: Membership) => {
    setActiveTenant(m.tenant, m.role);
    navigate('/', { replace: true });
  };

  // Un solo tenant → autoseleccionar (recomendación del integration guide)
  useEffect(() => {
    if (memberships?.length === 1) {
      const m = memberships[0];
      useTenantStore.getState().setActiveTenant(m.tenant, m.role);
      navigate('/', { replace: true });
    }
  }, [memberships, navigate]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">¿Dónde vas a trabajar hoy?</h1>
        <p className="text-muted-foreground mt-1 text-sm">Elige un estudio para continuar.</p>
      </header>

      {isPending && <p className="text-muted-foreground text-sm">Cargando tus estudios…</p>}

      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(error)}
        </p>
      )}

      {memberships?.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-sm">
              No tienes membresías activas. Pide a un estudio que te invite, o contacta soporte.
            </p>
          </CardContent>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {memberships?.map((m) => (
          <li key={m.tenant.id}>
            <button
              type="button"
              onClick={() => select(m)}
              className="bg-card hover:bg-accent flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors"
            >
              <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
                {m.tenant.type === 'studio' ? (
                  <Building2 className="size-5" />
                ) : (
                  <UserIcon className="size-5" />
                )}
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{m.tenant.name}</span>
                <span className="text-muted-foreground block text-xs">
                  {ROLE_LABEL[m.role] ?? m.role}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Button
        variant="ghost"
        className="text-muted-foreground self-center"
        onClick={() => logoutMutation.mutate()}
      >
        Cerrar sesión
      </Button>
    </main>
  );
}
