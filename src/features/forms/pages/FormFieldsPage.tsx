import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Asterisk, Plus, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import type { FormField, FormFieldType } from '@/types/api';
import { FIELD_TYPE_LABEL, TYPES_WITH_OPTIONS } from '../lib';
import { useCreateField, useDeleteField, useTemplate } from '../hooks';

const fieldSchema = z
  .object({
    field_type: z.string().min(1, 'Elige un tipo.'),
    label: z.string().min(1, 'La etiqueta es requerida.'),
    help_text: z.string(),
    placeholder: z.string(),
    required: z.boolean(),
    options: z.string(),
  })
  .refine(
    (v) =>
      !TYPES_WITH_OPTIONS.includes(v.field_type as FormFieldType) ||
      v.options.split(',').filter((o) => o.trim()).length >= 2,
    {
      message: 'Los campos de selección necesitan al menos 2 opciones (separadas por coma).',
      path: ['options'],
    },
  );
type FieldValues = z.infer<typeof fieldSchema>;

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function FieldForm({
  templateId,
  nextOrder,
  onDone,
}: {
  templateId: string;
  nextOrder: number;
  onDone: () => void;
}) {
  const createMutation = useCreateField(templateId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      field_type: 'text',
      label: '',
      help_text: '',
      placeholder: '',
      required: false,
      options: '',
    },
  });
  const fieldType = useWatch({ control, name: 'field_type' }) as FormFieldType;

  const onSubmit = (values: FieldValues) => {
    createMutation.mutate(
      {
        field_type: values.field_type as FormFieldType,
        label: values.label,
        help_text: values.help_text || undefined,
        placeholder: values.placeholder || undefined,
        required: values.required,
        order: nextOrder,
        options: TYPES_WITH_OPTIONS.includes(values.field_type as FormFieldType)
          ? values.options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-type">Tipo de campo</Label>
          <select id="field-type" className={selectClass} {...register('field_type')}>
            {(Object.keys(FIELD_TYPE_LABEL) as FormFieldType[]).map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-label">Etiqueta</Label>
          <Input id="field-label" placeholder="¿Qué te quieres tatuar?" {...register('label')} />
          {errors.label && <p className="text-destructive text-xs">{errors.label.message}</p>}
        </div>
      </div>

      {TYPES_WITH_OPTIONS.includes(fieldType) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-options">Opciones (separadas por coma)</Label>
          <Input
            id="field-options"
            placeholder="Brazo, Pierna, Espalda, Otro"
            {...register('options')}
          />
          {errors.options && <p className="text-destructive text-xs">{errors.options.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-help">Texto de ayuda (opcional)</Label>
          <Input id="field-help" {...register('help_text')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-placeholder">Placeholder (opcional)</Label>
          <Input id="field-placeholder" {...register('placeholder')} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" className="accent-primary size-4" {...register('required')} />
        Campo obligatorio
      </label>

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
          {createMutation.isPending ? 'Agregando…' : 'Agregar campo'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function FieldItem({ templateId, field }: { templateId: string; field: FormField }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteMutation = useDeleteField(templateId);

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-semibold">
            {field.label}
            {field.required && <Asterisk className="text-primary size-3.5 shrink-0" />}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {FIELD_TYPE_LABEL[field.field_type]}
            {field.options && field.options.length > 0 && ` · ${field.options.join(' / ')}`}
          </p>
        </div>

        {confirmingDelete ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(field.id)}
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
            aria-label={`Eliminar campo ${field.label}`}
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

export function FormFieldsPage() {
  const { id } = useParams<{ id: string }>();
  const template = useTemplate(id!);
  const [adding, setAdding] = useState(false);

  if (template.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando formulario…</p>;
  }
  if (template.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(template.error)}
      </p>
    );
  }

  const t = template.data;
  const sorted = t.fields.slice().sort((a, b) => a.order - b.order);
  const nextOrder = sorted.length > 0 ? Math.max(...sorted.map((f) => f.order)) + 10 : 10;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/formularios" aria-label="Volver a formularios">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{t.name}</h2>
          <p className="text-muted-foreground text-xs">
            Campos que verá el cliente, en orden. Los marcados con * son obligatorios.
          </p>
        </div>
        {!adding && (
          <Button className="rounded-full font-semibold" onClick={() => setAdding(true)}>
            <Plus /> Campo
          </Button>
        )}
      </header>

      {adding && (
        <Card>
          <CardContent>
            <FieldForm templateId={t.id} nextOrder={nextOrder} onDone={() => setAdding(false)} />
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 && !adding && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin campos aún. Un formulario sin campos no puede recibir respuestas.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {sorted.map((f) => (
          <li key={f.id}>
            <FieldItem templateId={t.id} field={f} />
          </li>
        ))}
      </ul>
    </main>
  );
}
