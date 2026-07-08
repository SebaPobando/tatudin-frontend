import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, KeyRound, Plug, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import { cn } from '@/lib/utils';
import type { ConnectionStatus, IntegrationConnection, IntegrationProvider } from '@/types/api';
import {
  CONNECTION_STATUS_LABEL,
  CONNECTION_STATUS_STYLE,
  PROVIDER_LABEL,
  PROVIDER_OPTIONS,
  parseConfig,
} from '../lib';
import {
  useConnections,
  useCreateConnection,
  useDeleteConnection,
  useNotifications,
  useUpdateConnection,
} from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

interface FormValues {
  provider: IntegrationProvider;
  status: ConnectionStatus;
  config: string;
  secret: string;
}

function ConnectionForm({
  existing,
  takenProviders,
  onDone,
}: {
  existing?: IntegrationConnection;
  takenProviders: Set<IntegrationProvider>;
  onDone: () => void;
}) {
  const createMutation = useCreateConnection();
  const updateMutation = useUpdateConnection();
  const isEdit = !!existing;

  const available = PROVIDER_OPTIONS.filter((p) => !takenProviders.has(p));
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      provider: existing?.provider ?? available[0] ?? 'google_calendar',
      status: existing?.status ?? 'inactive',
      config: existing ? JSON.stringify(existing.config, null, 2) : '',
      secret: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    let config: Record<string, unknown>;
    try {
      config = parseConfig(values.config);
    } catch (e) {
      setError('config', { message: e instanceof Error ? e.message : 'JSON inválido.' });
      return;
    }
    // El secret solo se envía si el usuario escribió uno (vacío = mantener el actual).
    const secret = values.secret.trim() ? values.secret : undefined;

    if (isEdit) {
      updateMutation.mutate(
        { id: existing.id, status: values.status, config, secret },
        { onSuccess: onDone },
      );
    } else {
      createMutation.mutate(
        { provider: values.provider, status: values.status, config, secret },
        { onSuccess: onDone },
      );
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending;
  const mutError = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conn-provider">Proveedor</Label>
          <select
            id="conn-provider"
            className={selectClass}
            disabled={isEdit}
            {...register('provider')}
          >
            {(isEdit ? [existing.provider] : available).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conn-status">Estado</Label>
          <select id="conn-status" className={selectClass} {...register('status')}>
            {(Object.keys(CONNECTION_STATUS_LABEL) as ConnectionStatus[]).map((s) => (
              <option key={s} value={s}>
                {CONNECTION_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conn-config">Config (JSON, opcional)</Label>
        <textarea
          id="conn-config"
          rows={3}
          placeholder='{ "calendar_id": "..." }'
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
          {...register('config')}
        />
        {errors.config && <p className="text-destructive text-xs">{errors.config.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conn-secret">
          Secret {isEdit && '(dejar vacío = mantener el actual)'}
        </Label>
        <Input
          id="conn-secret"
          type="password"
          autoComplete="off"
          placeholder="OAuth token, API key…"
          {...register('secret')}
        />
        <p className="text-muted-foreground text-xs">Se cifra en el servidor antes de guardar.</p>
      </div>

      {mutError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(mutError)}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 rounded-full font-semibold" disabled={pending}>
          {pending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Conectar'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ConnectionCard({
  connection,
  takenProviders,
}: {
  connection: IntegrationConnection;
  takenProviders: Set<IntegrationProvider>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateMutation = useUpdateConnection();
  const deleteMutation = useDeleteConnection();

  if (editing) {
    return (
      <Card>
        <CardContent>
          <ConnectionForm
            existing={connection}
            takenProviders={takenProviders}
            onDone={() => setEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  const nextStatus: ConnectionStatus =
    connection.status === 'active' ? 'inactive' : 'active';

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Plug className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{PROVIDER_LABEL[connection.provider]}</p>
          <p className="text-muted-foreground truncate text-xs">
            {connection.has_secret ? 'Secret configurado' : 'Sin secret'}
            {connection.last_error && ` · ${connection.last_error}`}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
            CONNECTION_STATUS_STYLE[connection.status],
          )}
        >
          {CONNECTION_STATUS_LABEL[connection.status]}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: connection.id, status: nextStatus })}
        >
          {connection.status === 'active' ? 'Desactivar' : 'Activar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setEditing(true)}
        >
          Editar
        </Button>

        {confirmingDelete ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(connection.id)}
            >
              Sí
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setConfirmingDelete(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar ${PROVIDER_LABEL[connection.provider]}`}
            className="text-destructive rounded-full"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationsPage() {
  const role = useTenantStore((s) => s.activeTenant?.role);
  const isStaff = role === 'owner' || role === 'admin';
  const connections = useConnections();
  const notifications = useNotifications();
  const [creating, setCreating] = useState(false);

  if (!isStaff) {
    return (
      <main className="mx-auto w-full max-w-2xl p-6">
        <p className="text-muted-foreground text-sm">
          Integraciones está disponible solo para owner y admin.
        </p>
      </main>
    );
  }

  const takenProviders = new Set((connections.data ?? []).map((c) => c.provider));
  const allTaken = takenProviders.size >= PROVIDER_OPTIONS.length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Integraciones</h2>
          <p className="text-muted-foreground text-xs">
            Conecta Google Calendar, WhatsApp y más. Los secrets se guardan cifrados.
          </p>
        </div>
        {!creating && !allTaken && (
          <Button className="rounded-full font-semibold" onClick={() => setCreating(true)}>
            <Plus /> Conectar
          </Button>
        )}
      </header>

      {creating && (
        <Card>
          <CardContent>
            <ConnectionForm takenProviders={takenProviders} onDone={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {connections.isPending && (
        <p className="text-muted-foreground text-sm">Cargando conexiones…</p>
      )}
      {connections.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(connections.error)}
        </p>
      )}
      {connections.data?.length === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <KeyRound className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            Sin integraciones aún. Conecta la primera.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {connections.data?.map((c) => (
          <li key={c.id}>
            <ConnectionCard connection={c} takenProviders={takenProviders} />
          </li>
        ))}
      </ul>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="text-muted-foreground size-4" />
          <CardTitle className="text-base">Notificaciones enviadas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {notifications.isPending && (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          )}
          {notifications.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getApiErrorMessage(notifications.error)}
            </p>
          )}
          {notifications.data?.results.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Aún no se ha enviado ninguna notificación.
            </p>
          )}
          {notifications.data?.results.map((n) => (
            <div key={n.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{n.event_type ?? 'Notificación'}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {n.recipient ?? 'sin destinatario'}
                  {n.last_error && ` · ${n.last_error}`}
                </p>
              </div>
              {n.status && (
                <span className="text-muted-foreground shrink-0 text-xs font-semibold uppercase">
                  {n.status}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
