import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PartyPopper, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import { cn } from '@/lib/utils';
import type { Event, EventStatus } from '@/types/api';
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_OPTIONS,
  EVENT_STATUS_STYLE,
  formatEventRange,
  localToISO,
} from '../lib';
import { useCreateEvent, useEvents } from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

const eventSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido.'),
    location: z.string(),
    status: z.string(),
    start_at: z.string().min(1, 'Indica cuándo empieza.'),
    end_at: z.string().min(1, 'Indica cuándo termina.'),
    description: z.string(),
  })
  .refine((v) => !v.start_at || !v.end_at || v.end_at > v.start_at, {
    message: 'El fin debe ser posterior al inicio.',
    path: ['end_at'],
  });
type EventValues = z.infer<typeof eventSchema>;

function EventForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateEvent();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      location: '',
      status: 'draft',
      start_at: '',
      end_at: '',
      description: '',
    },
  });

  const onSubmit = (values: EventValues) => {
    createMutation.mutate(
      {
        name: values.name,
        location: values.location || undefined,
        status: (values.status || 'draft') as EventStatus,
        start_at: localToISO(values.start_at),
        end_at: localToISO(values.end_at),
        description: values.description || undefined,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-name">Nombre</Label>
        <Input id="ev-name" placeholder="Convención de Tatuaje 2026" {...register('name')} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-location">Lugar (opcional)</Label>
          <Input id="ev-location" placeholder="Bogotá" {...register('location')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-status">Estado</Label>
          <select id="ev-status" className={selectClass} {...register('status')}>
            {EVENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {EVENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-start">Empieza</Label>
          <Input id="ev-start" type="datetime-local" {...register('start_at')} />
          {errors.start_at && <p className="text-destructive text-xs">{errors.start_at.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-end">Termina</Label>
          <Input id="ev-end" type="datetime-local" {...register('end_at')} />
          {errors.end_at && <p className="text-destructive text-xs">{errors.end_at.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-desc">Descripción (opcional)</Label>
        <textarea
          id="ev-desc"
          rows={2}
          placeholder="Detalles del evento, agenda, invitados…"
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register('description')}
        />
      </div>

      {createMutation.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(createMutation.error)}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1 rounded-full font-semibold"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creando…' : 'Crear evento'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      to={`/eventos/${event.id}`}
      className="bg-card hover:bg-accent/40 flex flex-col gap-2 rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-semibold">{event.name}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
            EVENT_STATUS_STYLE[event.status],
          )}
        >
          {EVENT_STATUS_LABEL[event.status]}
        </span>
      </div>
      <p className="text-muted-foreground truncate text-xs">
        {formatEventRange(event.start_at, event.end_at)}
        {event.location && ` · ${event.location}`}
      </p>
    </Link>
  );
}

export function EventsPage() {
  const events = useEvents();
  const role = useTenantStore((s) => s.activeTenant?.role);
  const isStaff = role === 'owner' || role === 'admin';
  const [creating, setCreating] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground text-xs">
            Convenciones, guest spots y sesiones especiales con su equipo de artistas.
          </p>
        </div>
        {isStaff && !creating && (
          <Button className="rounded-full font-semibold" onClick={() => setCreating(true)}>
            <Plus /> Nuevo
          </Button>
        )}
      </header>

      {creating && (
        <Card>
          <CardContent>
            <EventForm onDone={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {events.isPending && <p className="text-muted-foreground text-sm">Cargando eventos…</p>}
      {events.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(events.error)}
        </p>
      )}
      {events.data?.length === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <PartyPopper className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            {isStaff
              ? 'Sin eventos aún. Crea el primero y asigna a tu equipo.'
              : 'No hay eventos por ahora.'}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {events.data?.map((e) => (
          <li key={e.id}>
            <EventCard event={e} />
          </li>
        ))}
      </ul>
    </main>
  );
}
