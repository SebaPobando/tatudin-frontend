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
import { cn } from '@/lib/utils';
import type { AppointmentReason } from '@/types/api';
import { toCode } from '../lib';
import { useCreateReason, useDeleteReason, useReasons, useUpdateReason } from '../hooks';

const reasonSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido.'),
});
type ReasonValues = z.infer<typeof reasonSchema>;

function ReasonForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  defaultValues?: ReasonValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ReasonValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReasonValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: defaultValues ?? { name: '', color: '#2563eb' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="reason-name">Nombre</Label>
          <Input id="reason-name" placeholder="Tatuaje nuevo" {...register('name')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason-color">Color</Label>
          <input
            id="reason-color"
            type="color"
            className="border-input h-9 w-14 cursor-pointer rounded-md border"
            {...register('color')}
          />
        </div>
      </div>
      {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
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

function ReasonItem({ reason }: { reason: AppointmentReason }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateMutation = useUpdateReason();
  const deleteMutation = useDeleteReason();

  if (editing) {
    return (
      <Card>
        <CardContent>
          <ReasonForm
            defaultValues={{ name: reason.name, color: reason.color }}
            submitLabel="Guardar"
            pending={updateMutation.isPending}
            onSubmit={(values) =>
              updateMutation.mutate(
                { id: reason.id, ...values },
                { onSuccess: () => setEditing(false) },
              )
            }
            onCancel={() => setEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full"
          style={{ backgroundColor: reason.color }}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold',
              !reason.is_active && 'text-muted-foreground line-through',
            )}
          >
            {reason.name}
          </p>
          <p className="text-muted-foreground truncate font-mono text-xs">{reason.code}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: reason.id, is_active: !reason.is_active })}
        >
          {reason.is_active ? 'Desactivar' : 'Activar'}
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
              onClick={() => deleteMutation.mutate(reason.id)}
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
            aria-label={`Eliminar ${reason.name}`}
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

export function ReasonsPage() {
  const reasons = useReasons();
  const createMutation = useCreateReason();
  const [creating, setCreating] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/agenda/ajustes" aria-label="Volver a ajustes">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Motivos de cita</h2>
          <p className="text-muted-foreground text-xs">
            Clasifican tus citas y alimentan los reportes de analytics.
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
            <ReasonForm
              submitLabel="Crear motivo"
              pending={createMutation.isPending}
              onSubmit={(values) =>
                createMutation.mutate(
                  { ...values, code: toCode(values.name) },
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

      {reasons.isPending && <p className="text-muted-foreground text-sm">Cargando motivos…</p>}
      {reasons.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(reasons.error)}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {reasons.data
          ?.slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((r) => (
            <li key={r.id}>
              <ReasonItem reason={r} />
            </li>
          ))}
      </ul>
    </main>
  );
}
