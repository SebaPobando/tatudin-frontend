import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useTeam } from '@/features/team/hooks';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/api';
import {
  durationToMinutes,
  serviceSchema,
  serviceToValues,
  valuesToServicePayload,
  type ServiceValues,
} from '../lib';
import { useCreateService, useDeleteService, useServices, useUpdateService } from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

const EMPTY: ServiceValues = {
  name: '',
  description: '',
  duration_minutes: '60',
  base_price: '',
  requires_deposit: false,
  default_deposit_amount: '',
  color: '#2563eb',
  default_artist: '',
};

function ServiceForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  defaultValues?: ServiceValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ServiceValues) => void;
  onCancel: () => void;
}) {
  const team = useTeam();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultValues ?? EMPTY,
  });
  const requiresDeposit = useWatch({ control, name: 'requires_deposit' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="svc-name">Nombre</Label>
          <Input id="svc-name" placeholder="Flash" {...register('name')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-color">Color</Label>
          <input
            id="svc-color"
            type="color"
            className="border-input h-9 w-14 cursor-pointer rounded-md border"
            {...register('color')}
          />
        </div>
      </div>
      {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="svc-description">Descripción (opcional)</Label>
        <Input
          id="svc-description"
          placeholder="Diseños de catálogo"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-duration">Duración (minutos)</Label>
          <Input id="svc-duration" inputMode="numeric" {...register('duration_minutes')} />
          {errors.duration_minutes && (
            <p className="text-destructive text-xs">{errors.duration_minutes.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-price">Precio base (opcional)</Label>
          <Input
            id="svc-price"
            inputMode="decimal"
            placeholder="350000"
            {...register('base_price')}
          />
          {errors.base_price && (
            <p className="text-destructive text-xs">{errors.base_price.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="svc-artist">Artista por defecto (opcional)</Label>
        <select id="svc-artist" className={selectClass} {...register('default_artist')}>
          <option value="">Sin artista fijo</option>
          {team.data?.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.user_full_name || m.user_email}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="accent-primary size-4"
          {...register('requires_deposit')}
        />
        Requiere depósito
      </label>

      {requiresDeposit && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="svc-deposit">Monto sugerido del depósito</Label>
          <Input
            id="svc-deposit"
            inputMode="decimal"
            placeholder="100000"
            {...register('default_deposit_amount')}
          />
          {errors.default_deposit_amount && (
            <p className="text-destructive text-xs">{errors.default_deposit_amount.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 rounded-full font-semibold" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ServiceItem({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  if (editing) {
    return (
      <Card>
        <CardContent>
          <ServiceForm
            defaultValues={serviceToValues(service)}
            submitLabel="Guardar"
            pending={updateMutation.isPending}
            onSubmit={(values) =>
              updateMutation.mutate(
                { id: service.id, ...valuesToServicePayload(values) },
                { onSuccess: () => setEditing(false) },
              )
            }
            onCancel={() => setEditing(false)}
          />
          {updateMutation.isError && (
            <p role="alert" className="text-destructive mt-2 text-sm">
              {getApiErrorMessage(updateMutation.error)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const minutes = durationToMinutes(service.default_duration);

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full"
          style={{ backgroundColor: service.color || '#2563eb' }}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold',
              !service.is_active && 'text-muted-foreground line-through',
            )}
          >
            {service.name}
          </p>
          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
            <Clock className="size-3" />
            {minutes >= 60
              ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`
              : `${minutes}m`}
            {service.base_price && ` · ${formatMoney(service.base_price)}`}
            {service.requires_deposit && ' · Con depósito'}
            {service.default_artist_email && ` · ${service.default_artist_email}`}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: service.id, is_active: !service.is_active })}
        >
          {service.is_active ? 'Desactivar' : 'Activar'}
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
              onClick={() => deleteMutation.mutate(service.id)}
            >
              Sí, borrar
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
            aria-label={`Eliminar ${service.name}`}
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

export function ServicesPage() {
  const services = useServices();
  const createMutation = useCreateService();
  const [creating, setCreating] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Servicios</h2>
          <p className="text-muted-foreground text-xs">
            Plantillas reutilizables: duración, precio y depósito se heredan al agendar.
          </p>
        </div>
        {!creating && (
          <Button className="rounded-full font-semibold" onClick={() => setCreating(true)}>
            <Plus /> Nuevo
          </Button>
        )}
      </header>

      {creating && (
        <Card>
          <CardContent>
            <ServiceForm
              submitLabel="Crear servicio"
              pending={createMutation.isPending}
              onSubmit={(values) =>
                createMutation.mutate(valuesToServicePayload(values), {
                  onSuccess: () => setCreating(false),
                })
              }
              onCancel={() => setCreating(false)}
            />
            {createMutation.isError && (
              <p role="alert" className="text-destructive mt-2 text-sm">
                {getApiErrorMessage(createMutation.error)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {services.isPending && <p className="text-muted-foreground text-sm">Cargando servicios…</p>}
      {services.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(services.error)}
        </p>
      )}
      {services.data?.length === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin servicios aún. Crea plantillas como “Flash”, “Cover up” o “Sesión de proyecto”.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {services.data
          ?.slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((s) => (
            <li key={s.id}>
              <ServiceItem service={s} />
            </li>
          ))}
      </ul>
    </main>
  );
}
