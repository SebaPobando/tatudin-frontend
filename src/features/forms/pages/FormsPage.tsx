import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Inbox, Link2, ListChecks, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import { cn } from '@/lib/utils';
import type { FormTemplate, FormTemplateType } from '@/types/api';
import { TEMPLATE_TYPE_LABEL, toSlug } from '../lib';
import { useCreateTemplate, useDeleteTemplate, useTemplates, useUpdateTemplate } from '../hooks';

const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  type: z.string(),
  description: z.string(),
  instructions: z.string(),
  submit_message: z.string(),
});
type TemplateValues = z.infer<typeof templateSchema>;

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function TemplateForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateTemplate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      type: 'custom',
      description: '',
      instructions: '',
      submit_message: '¡Gracias! Te contactaremos pronto.',
    },
  });

  const onSubmit = (values: TemplateValues) => {
    createMutation.mutate(
      {
        name: values.name,
        slug: toSlug(values.name),
        type: (values.type || 'custom') as FormTemplateType,
        description: values.description || undefined,
        instructions: values.instructions || undefined,
        submit_message: values.submit_message || undefined,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-name">Nombre</Label>
          <Input id="tpl-name" placeholder="Cotización de tatuaje" {...register('name')} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-type">Tipo</Label>
          <select id="tpl-type" className={selectClass} {...register('type')}>
            {(Object.keys(TEMPLATE_TYPE_LABEL) as FormTemplateType[]).map((t) => (
              <option key={t} value={t}>
                {TEMPLATE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tpl-instructions">Instrucciones para el cliente (opcional)</Label>
        <textarea
          id="tpl-instructions"
          rows={2}
          placeholder="Cuéntanos tu idea y te preparamos una cotización…"
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register('instructions')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tpl-submit">Mensaje tras enviar</Label>
        <Input id="tpl-submit" {...register('submit_message')} />
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
          {createMutation.isPending ? 'Creando…' : 'Crear formulario'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function TemplateItem({ template }: { template: FormTemplate }) {
  const tenantSlug = useTenantStore((s) => s.activeTenant?.slug);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-semibold',
              !template.is_active && 'text-muted-foreground line-through',
            )}
          >
            {template.name}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {TEMPLATE_TYPE_LABEL[template.type]} · {template.fields_count} campo
            {template.fields_count === 1 ? '' : 's'} · {template.submissions_count} respuesta
            {template.submissions_count === 1 ? '' : 's'} · /{template.slug}
          </p>
        </div>

        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link to={`/formularios/${template.id}/campos`}>
            <ListChecks /> Campos
          </Link>
        </Button>
        {template.is_active && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/f/${tenantSlug}/${template.slug}`,
              );
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <Link2 /> {copied ? '¡Copiado!' : 'Link'}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: template.id, is_active: !template.is_active })}
        >
          {template.is_active ? 'Desactivar' : 'Activar'}
        </Button>

        {confirmingDelete ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(template.id)}
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
            aria-label={`Eliminar ${template.name}`}
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

export function FormsPage() {
  const templates = useTemplates();
  const [creating, setCreating] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Formularios</h2>
          <p className="text-muted-foreground text-xs">
            Plantillas para captar clientes: cotizaciones, consentimientos, reservas.
          </p>
        </div>
        <Button variant="outline" className="rounded-full" asChild>
          <Link to="/formularios/entradas">
            <Inbox /> Entradas
          </Link>
        </Button>
        {!creating && (
          <Button className="rounded-full font-semibold" onClick={() => setCreating(true)}>
            <Plus /> Nuevo
          </Button>
        )}
      </header>

      {creating && (
        <Card>
          <CardContent>
            <TemplateForm onDone={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {templates.isPending && (
        <p className="text-muted-foreground text-sm">Cargando formularios…</p>
      )}
      {templates.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(templates.error)}
        </p>
      )}
      {templates.data?.length === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin formularios aún. Crea el primero y agrégale campos.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {templates.data?.map((t) => (
          <li key={t.id}>
            <TemplateItem template={t} />
          </li>
        ))}
      </ul>
    </main>
  );
}
