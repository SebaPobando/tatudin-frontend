import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import type { PublicFormField } from '@/types/api';
import { buildSubmitPayload, validateRequired } from '../lib';
import { usePublicForm, useSubmitPublicForm } from '../hooks';

const inputClass =
  'border-input bg-card placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

/** Renderer dinámico: los 12 tipos del builder → inputs nativos. */
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PublicFormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.field_type) {
    case 'textarea':
    case 'signature':
      return (
        <textarea
          id={field.id}
          rows={field.field_type === 'signature' ? 2 : 4}
          placeholder={
            field.placeholder ||
            (field.field_type === 'signature' ? 'Escribe tu nombre completo como firma' : '')
          }
          className={`${inputClass} h-auto py-2`}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'select':
      return (
        <select
          id={field.id}
          className={inputClass}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Elige una opción…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'multiselect': {
      const selected = (value as string[]) ?? [];
      return (
        <div className="flex flex-col gap-2">
          {(field.options ?? []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary size-4"
                checked={selected.includes(o)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, o] : selected.filter((s) => s !== o))
                }
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={field.id}
            type="checkbox"
            className="accent-primary size-4"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          Sí
        </label>
      );
    default: {
      const typeMap: Record<string, string> = {
        email: 'email',
        phone: 'tel',
        number: 'number',
        date: 'date',
        datetime: 'datetime-local',
        file_url: 'url',
      };
      return (
        <Input
          id={field.id}
          type={typeMap[field.field_type] ?? 'text'}
          placeholder={field.placeholder || (field.field_type === 'file_url' ? 'https://…' : '')}
          className="bg-card h-10"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
  }
}

export function PublicFormPage() {
  const { tenantSlug, formSlug } = useParams<{ tenantSlug: string; formSlug: string }>();
  const form = usePublicForm(tenantSlug!, formSlug!);
  const submitMutation = useSubmitPublicForm(tenantSlug!, formSlug!);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  if (form.isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-muted-foreground animate-pulse text-sm">Cargando formulario…</p>
      </main>
    );
  }
  if (form.isError) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <p role="alert" className="text-muted-foreground text-sm">
          Este formulario no existe o ya no está disponible.
        </p>
      </main>
    );
  }

  const t = form.data;
  const sorted = t.fields.slice().sort((a, b) => a.order - b.order);

  if (sent) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">¡Enviado!</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          {t.submit_message || 'Gracias, te contactaremos pronto.'}
        </p>
      </main>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRequired(sorted, values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    submitMutation.mutate(buildSubmitPayload(sorted, values), {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t.name}</h1>
        {t.instructions && <p className="text-muted-foreground mt-2 text-sm">{t.instructions}</p>}
      </header>

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {sorted.map((f) => (
              <div key={f.id} className="flex flex-col gap-1.5">
                <Label htmlFor={f.id}>
                  {f.label}
                  {f.required && <span className="text-primary"> *</span>}
                </Label>
                <FieldInput
                  field={f}
                  value={values[f.id]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
                />
                {f.help_text && <p className="text-muted-foreground text-xs">{f.help_text}</p>}
                {errors[f.id] && <p className="text-destructive text-xs">{errors[f.id]}</p>}
              </div>
            ))}

            {submitMutation.isError && (
              <p role="alert" className="text-destructive text-sm">
                {getApiErrorMessage(submitMutation.error)}
              </p>
            )}

            <Button
              type="submit"
              className="mt-2 rounded-full font-semibold"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Enviando…' : 'Enviar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground pb-4 text-center text-xs">Hecho con Tatudin</p>
    </main>
  );
}
