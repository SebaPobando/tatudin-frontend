import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useTeam } from '@/features/team/hooks';
import { cn } from '@/lib/utils';
import type { WorkingHours } from '@/types/api';
import { DAY_LABEL } from '../lib';
import {
  useCreateWorkingHours,
  useDeleteWorkingHours,
  useToggleWorkingHours,
  useWorkingHours,
} from '../hooks';

const workingHoursSchema = z
  .object({
    artist: z.string(), // '' = default del estudio
    day_of_week: z.string().min(1, 'Elige un día.'),
    start_time: z.string().min(1, 'Hora de inicio requerida.'),
    end_time: z.string().min(1, 'Hora de fin requerida.'),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: 'La hora de fin debe ser posterior a la de inicio.',
    path: ['end_time'],
  });
type WorkingHoursValues = z.infer<typeof workingHoursSchema>;

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function WorkingHoursForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (values: WorkingHoursValues) => void;
  onCancel: () => void;
}) {
  const team = useTeam();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkingHoursValues>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: { artist: '', day_of_week: '', start_time: '10:00', end_time: '19:00' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wh-artist">Aplica a</Label>
        <select id="wh-artist" className={selectClass} {...register('artist')}>
          <option value="">Todo el estudio (default)</option>
          {team.data?.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.user_full_name || m.user_email}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wh-day">Día</Label>
        <select id="wh-day" className={selectClass} {...register('day_of_week')}>
          <option value="">Elige un día…</option>
          {DAY_LABEL.map((label, value) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.day_of_week && (
          <p className="text-destructive text-xs">{errors.day_of_week.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wh-start">Desde</Label>
          <Input id="wh-start" type="time" {...register('start_time')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wh-end">Hasta</Label>
          <Input id="wh-end" type="time" {...register('end_time')} />
          {errors.end_time && <p className="text-destructive text-xs">{errors.end_time.message}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 rounded-full font-semibold" disabled={pending}>
          {pending ? 'Guardando…' : 'Agregar horario'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function WorkingHoursItem({ wh }: { wh: WorkingHours }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const toggleMutation = useToggleWorkingHours();
  const deleteMutation = useDeleteWorkingHours();

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold', !wh.is_active && 'text-muted-foreground line-through')}>
            {DAY_LABEL[wh.day_of_week]} · {wh.start_time.slice(0, 5)}–{wh.end_time.slice(0, 5)}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {wh.artist_email ?? 'Todo el estudio'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={toggleMutation.isPending}
          onClick={() => toggleMutation.mutate({ id: wh.id, is_active: !wh.is_active })}
        >
          {wh.is_active ? 'Pausar' : 'Reactivar'}
        </Button>

        {confirmingDelete ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(wh.id)}
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
            aria-label={`Eliminar horario de ${DAY_LABEL[wh.day_of_week]}`}
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

export function WorkingHoursPage() {
  const workingHours = useWorkingHours();
  const createMutation = useCreateWorkingHours();
  const [creating, setCreating] = useState(false);

  const sorted = (workingHours.data ?? [])
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/agenda/ajustes" aria-label="Volver a ajustes">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Horarios de trabajo</h2>
          <p className="text-muted-foreground text-xs">
            Definen los slots libres del calendario público. “Pausar” sirve para vacaciones.
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
            <WorkingHoursForm
              pending={createMutation.isPending}
              onSubmit={(values) =>
                createMutation.mutate(
                  {
                    artist: values.artist || null,
                    day_of_week: Number(values.day_of_week),
                    start_time: values.start_time,
                    end_time: values.end_time,
                  },
                  { onSuccess: () => setCreating(false) },
                )
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

      {workingHours.isPending && (
        <p className="text-muted-foreground text-sm">Cargando horarios…</p>
      )}
      {workingHours.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(workingHours.error)}
        </p>
      )}
      {workingHours.data?.length === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin horarios configurados. Sin ellos, el calendario público no puede ofrecer slots.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {sorted.map((wh) => (
          <li key={wh.id}>
            <WorkingHoursItem wh={wh} />
          </li>
        ))}
      </ul>
    </main>
  );
}
