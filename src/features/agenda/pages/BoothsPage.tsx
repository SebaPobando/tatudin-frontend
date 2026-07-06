import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { cn } from '@/lib/utils';
import type { Booth } from '@/types/api';
import { boothSchema, type BoothValues } from '../schemas';
import { useBooths, useCreateBooth, useDeleteBooth, useUpdateBooth } from '../hooks';

function BoothForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  defaultValues?: BoothValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: BoothValues) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BoothValues>({
    resolver: zodResolver(boothSchema),
    defaultValues: defaultValues ?? { name: '', description: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="booth-name">Nombre</Label>
        <Input id="booth-name" placeholder="Cabina 1" {...register('name')} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="booth-description">Descripción (opcional)</Label>
        <Input id="booth-description" placeholder="Cabina principal" {...register('description')} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1 rounded-full font-semibold" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

function BoothItem({ booth }: { booth: Booth }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateMutation = useUpdateBooth();
  const deleteMutation = useDeleteBooth();

  if (editing) {
    return (
      <Card>
        <CardContent>
          <BoothForm
            defaultValues={{ name: booth.name, description: booth.description ?? '' }}
            submitLabel="Guardar"
            pending={updateMutation.isPending}
            onSubmit={(values) =>
              updateMutation.mutate(
                { id: booth.id, ...values },
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
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold',
              !booth.is_active && 'text-muted-foreground line-through',
            )}
          >
            {booth.name}
          </p>
          {booth.description && (
            <p className="text-muted-foreground truncate text-xs">{booth.description}</p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: booth.id, is_active: !booth.is_active })}
        >
          {booth.is_active ? 'Desactivar' : 'Activar'}
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
              onClick={() => deleteMutation.mutate(booth.id)}
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
            aria-label={`Eliminar ${booth.name}`}
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

export function BoothsPage() {
  const booths = useBooths();
  const createMutation = useCreateBooth();
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
          <h2 className="text-2xl font-bold tracking-tight">Cabinas</h2>
          <p className="text-muted-foreground text-xs">
            El backend impide citas solapadas por cabina — configúralas según tu espacio físico.
          </p>
        </div>
        {!creating && (
          <Button className="rounded-full font-semibold" onClick={() => setCreating(true)}>
            <Plus /> Nueva
          </Button>
        )}
      </header>

      {creating && (
        <Card>
          <CardContent>
            <BoothForm
              submitLabel="Crear cabina"
              pending={createMutation.isPending}
              onSubmit={(values) =>
                createMutation.mutate(values, { onSuccess: () => setCreating(false) })
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

      {booths.isPending && <p className="text-muted-foreground text-sm">Cargando cabinas…</p>}
      {booths.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(booths.error)}
        </p>
      )}
      {booths.data?.length === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin cabinas aún. Si tu estudio tiene espacios de trabajo separados, créalos aquí.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {booths.data?.map((b) => (
          <li key={b.id}>
            <BoothItem booth={b} />
          </li>
        ))}
      </ul>
    </main>
  );
}
