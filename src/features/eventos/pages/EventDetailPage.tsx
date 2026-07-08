import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MapPin, Trash2, UserPlus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import { useTeam } from '@/features/team/hooks';
import { cn } from '@/lib/utils';
import type { EventArtist } from '@/types/api';
import { EVENT_STATUS_LABEL, EVENT_STATUS_STYLE, formatEventRange } from '../lib';
import {
  useAssignArtist,
  useDeleteEvent,
  useEvent,
  useEventArtists,
  useRemoveArtist,
} from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

const assignSchema = z.object({
  user_id: z.string().min(1, 'Elige un artista.'),
  commission_percentage: z
    .string()
    .refine((v) => v === '' || (Number(v) >= 0 && Number(v) <= 100), '0 a 100.'),
  notes: z.string(),
});
type AssignValues = z.infer<typeof assignSchema>;

function AssignArtistForm({
  eventId,
  assignedUserIds,
  onDone,
}: {
  eventId: string;
  assignedUserIds: Set<string>;
  onDone: () => void;
}) {
  const team = useTeam();
  const assignMutation = useAssignArtist(eventId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { user_id: '', commission_percentage: '', notes: '' },
  });

  // Sólo artistas activos que aún no están asignados a este evento.
  const available = (team.data ?? []).filter(
    (m) => m.is_active && !assignedUserIds.has(m.user_id),
  );

  const onSubmit = (values: AssignValues) => {
    assignMutation.mutate(
      {
        user_id: values.user_id,
        commission_percentage: values.commission_percentage || undefined,
        notes: values.notes || undefined,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-user">Artista</Label>
        <select id="assign-user" className={selectClass} {...register('user_id')}>
          <option value="">Selecciona…</option>
          {available.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.user_full_name || m.user_email} ({m.role})
            </option>
          ))}
        </select>
        {errors.user_id && <p className="text-destructive text-xs">{errors.user_id.message}</p>}
        {team.data && available.length === 0 && (
          <p className="text-muted-foreground text-xs">
            No quedan miembros del equipo por asignar.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-commission">Comisión % (opcional)</Label>
        <Input
          id="assign-commission"
          inputMode="decimal"
          placeholder="Deja vacío para usar el default del estudio"
          {...register('commission_percentage')}
        />
        {errors.commission_percentage && (
          <p className="text-destructive text-xs">{errors.commission_percentage.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-notes">Notas (opcional)</Label>
        <Input id="assign-notes" placeholder="Sesión especial del evento" {...register('notes')} />
      </div>

      {assignMutation.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(assignMutation.error)}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1 rounded-full font-semibold"
          disabled={assignMutation.isPending}
        >
          {assignMutation.isPending ? 'Asignando…' : 'Asignar'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ArtistRow({
  artist,
  eventId,
  canManage,
}: {
  artist: EventArtist;
  eventId: string;
  canManage: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const removeMutation = useRemoveArtist(eventId);

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{artist.user_full_name || artist.user_email}</p>
        <p className="text-muted-foreground truncate text-xs">
          {artist.commission_percentage != null
            ? `Comisión ${artist.commission_percentage}%`
            : 'Comisión: default del estudio'}
          {artist.notes && ` · ${artist.notes}`}
        </p>
      </div>
      {canManage &&
        (confirming ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate(artist.id)}
            >
              Quitar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setConfirming(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Quitar ${artist.user_full_name || artist.user_email}`}
            className="text-destructive rounded-full"
            onClick={() => setConfirming(true)}
          >
            <Trash2 />
          </Button>
        ))}
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const event = useEvent(id!);
  const artists = useEventArtists(id!);
  const deleteMutation = useDeleteEvent();
  const role = useTenantStore((s) => s.activeTenant?.role);
  const isStaff = role === 'owner' || role === 'admin';

  const [assigning, setAssigning] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (event.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando evento…</p>;
  }
  if (event.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(event.error)}
      </p>
    );
  }

  const e = event.data;
  const assignedUserIds = new Set((artists.data ?? []).map((a) => a.user_id));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/eventos" aria-label="Volver a eventos">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">{e.name}</h2>
          <p className="text-muted-foreground text-xs">
            {formatEventRange(e.start_at, e.end_at)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
            EVENT_STATUS_STYLE[e.status],
          )}
        >
          {EVENT_STATUS_LABEL[e.status]}
        </span>
      </header>

      {(e.location || e.description) && (
        <Card>
          <CardContent className="flex flex-col gap-2 text-sm">
            {e.location && (
              <p className="flex items-center gap-2">
                <MapPin className="text-muted-foreground size-4 shrink-0" />
                {e.location}
              </p>
            )}
            {e.description && <p className="text-muted-foreground">{e.description}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Artistas</CardTitle>
          {isStaff && !assigning && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setAssigning(true)}
            >
              <UserPlus /> Asignar
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {assigning && (
            <AssignArtistForm
              eventId={e.id}
              assignedUserIds={assignedUserIds}
              onDone={() => setAssigning(false)}
            />
          )}

          {artists.isPending && (
            <p className="text-muted-foreground text-sm">Cargando artistas…</p>
          )}
          {artists.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getApiErrorMessage(artists.error)}
            </p>
          )}
          {artists.data?.length === 0 && !assigning && (
            <p className="text-muted-foreground text-sm">Nadie asignado todavía.</p>
          )}

          {artists.data?.map((a) => (
            <ArtistRow key={a.id} artist={a} eventId={e.id} canManage={isStaff} />
          ))}
        </CardContent>
      </Card>

      {isStaff && (
        <div className="flex justify-end">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">¿Eliminar el evento?</span>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(e.id, { onSuccess: () => navigate('/eventos') })
                }
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
              size="sm"
              className="text-destructive rounded-full"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 /> Eliminar evento
            </Button>
          )}
        </div>
      )}

      {deleteMutation.isError && (
        <p role="alert" className="text-destructive text-right text-sm">
          {getApiErrorMessage(deleteMutation.error)}
        </p>
      )}
    </main>
  );
}
