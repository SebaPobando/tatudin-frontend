import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import type { UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients } from '@/features/clients/hooks';
import { useServices } from '@/features/catalog/hooks';
import { useTeam } from '@/features/team/hooks';
import { useBooths, useProjects, useReasons } from '../hooks';
import { appointmentSchema, type AppointmentValues } from '../schemas';

const EMPTY: AppointmentValues = {
  artist_id: '',
  client_id: '',
  reason_id: '',
  service_id: '',
  project_id: '',
  client_name: '',
  client_phone: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  start_time: '',
  end_time: '',
  booth_id: '',
  estimated_price: '',
  notes: '',
};

export function AppointmentForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
}: {
  defaultValues?: AppointmentValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: AppointmentValues, setError: UseFormSetError<AppointmentValues>) => void;
}) {
  const booths = useBooths();
  const team = useTeam(); // solo carga para owner/admin (enabled interno)
  const reasons = useReasons();
  const services = useServices();
  // v1: últimos 25 clientes; con más volumen esto será un combobox con búsqueda
  const clients = useClients({ page: 1 });
  const projects = useProjects();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: defaultValues ?? EMPTY,
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, setError))}
      className="flex flex-col gap-4"
      noValidate
    >
      {team.data && team.data.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="artist_id">Artista</Label>
          <select
            id="artist_id"
            className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('artist_id')}
          >
            <option value="">Yo</option>
            {team.data.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user_full_name || m.user_email}
              </option>
            ))}
          </select>
        </div>
      )}

      {clients.data && clients.data.results.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client_id">Cliente registrado (opcional)</Label>
          {/* La cita guarda snapshot de nombre/teléfono aunque vincules un
              Client (master doc §7.7) — por eso el campo de texto sigue */}
          <select
            id="client_id"
            className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('client_id')}
          >
            <option value="">Sin vincular</option>
            {clients.data.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.first_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client_name">Cliente</Label>
        <Input id="client_name" placeholder="Nombre del cliente" {...register('client_name')} />
        {errors.client_name && (
          <p className="text-destructive text-xs">{errors.client_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client_phone">Teléfono (opcional)</Label>
        <Input id="client_phone" placeholder="+57 300 000 0000" {...register('client_phone')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start_time">Inicio</Label>
          <Input id="start_time" type="time" {...register('start_time')} />
          {errors.start_time && (
            <p className="text-destructive text-xs">{errors.start_time.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end_time">Fin</Label>
          <Input id="end_time" type="time" {...register('end_time')} />
          {errors.end_time && <p className="text-destructive text-xs">{errors.end_time.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="booth_id">Cabina (opcional)</Label>
        {/* select nativo a propósito: accesible, cero deps; el de shadcn llega
            cuando el registry esté disponible o lo necesitemos con búsqueda */}
        <select
          id="booth_id"
          className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register('booth_id')}
        >
          <option value="">Sin cabina</option>
          {booths.data
            ?.filter((b) => b.is_active)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
        </select>
        {errors.booth_id && <p className="text-destructive text-xs">{errors.booth_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason_id">Motivo (opcional)</Label>
          <select
            id="reason_id"
            className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('reason_id')}
          >
            <option value="">Sin motivo</option>
            {reasons.data
              ?.filter((r) => r.is_active)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="service_id">Servicio (opcional)</Label>
          <select
            id="service_id"
            className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('service_id')}
          >
            <option value="">Sin servicio</option>
            {services.data
              ?.filter((sv) => sv.is_active)
              .map((sv) => (
                <option key={sv.id} value={sv.id}>
                  {sv.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {projects.data && projects.data.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project_id">Proyecto (opcional)</Label>
          <select
            id="project_id"
            className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('project_id')}
          >
            <option value="">Sin proyecto</option>
            {projects.data
              .filter((pr) => pr.status === 'planning' || pr.status === 'in_progress')
              .map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.title}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="estimated_price">Precio estimado (opcional)</Label>
        <Input
          id="estimated_price"
          inputMode="decimal"
          placeholder="350000.00"
          {...register('estimated_price')}
        />
        {errors.estimated_price && (
          <p className="text-destructive text-xs">{errors.estimated_price.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Manga japonesa, sesión 1 de 3…"
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register('notes')}
        />
      </div>

      {errors.root && (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" className="mt-2 rounded-full font-semibold" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  );
}
