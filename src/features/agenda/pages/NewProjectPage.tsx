import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { useClients } from '@/features/clients/hooks';
import { useTeam } from '@/features/team/hooks';
import { useAuthStore } from '@/stores/auth';
import { useCreateProject } from '../hooks';

const projectSchema = z.object({
  title: z.string().min(1, 'El título es requerido.'),
  client: z.string().min(1, 'El proyecto necesita un cliente registrado.'),
  lead_artist: z.string(), // '' = el user actual
  estimated_sessions: z
    .string()
    .refine((v) => v === '' || /^\d+$/.test(v), 'Número de sesiones inválido.'),
  estimated_total_price: z
    .string()
    .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Precio inválido.'),
  description: z.string(),
  reference_notes: z.string(),
});
type ProjectValues = z.infer<typeof projectSchema>;

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

export function NewProjectPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const team = useTeam();
  const clients = useClients({ page: 1 });
  const createMutation = useCreateProject();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      client: '',
      lead_artist: '',
      estimated_sessions: '',
      estimated_total_price: '',
      description: '',
      reference_notes: '',
    },
  });

  const onSubmit = (values: ProjectValues) => {
    if (!user) return;
    createMutation.mutate(
      {
        title: values.title,
        client: values.client,
        lead_artist: values.lead_artist || user.id,
        estimated_sessions: values.estimated_sessions ? Number(values.estimated_sessions) : null,
        estimated_total_price: values.estimated_total_price || undefined,
        description: values.description || undefined,
        reference_notes: values.reference_notes || undefined,
      },
      {
        onSuccess: (project) => navigate(`/proyectos/${project.id}`),
        onError: (error) =>
          setError('root', { type: 'server', message: getApiErrorMessage(error) }),
      },
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/proyectos" aria-label="Volver a proyectos">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo proyecto</h2>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" placeholder="Manga japonesa — brazo derecho" {...register('title')} />
          {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client">Cliente</Label>
          {/* A diferencia de las citas, el proyecto EXIGE cliente registrado */}
          <select id="client" className={selectClass} {...register('client')}>
            <option value="">Elige un cliente…</option>
            {clients.data?.results.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.first_name}
              </option>
            ))}
          </select>
          {errors.client && <p className="text-destructive text-xs">{errors.client.message}</p>}
          {clients.data?.count === 0 && (
            <p className="text-muted-foreground text-xs">
              No tienes clientes registrados —{' '}
              <Link to="/clientes/nuevo" className="text-primary underline">
                crea uno primero
              </Link>
              .
            </p>
          )}
        </div>

        {team.data && team.data.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead_artist">Artista responsable</Label>
            <select id="lead_artist" className={selectClass} {...register('lead_artist')}>
              <option value="">Yo</option>
              {team.data.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_full_name || m.user_email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimated_sessions">Sesiones estimadas</Label>
            <Input
              id="estimated_sessions"
              inputMode="numeric"
              placeholder="3"
              {...register('estimated_sessions')}
            />
            {errors.estimated_sessions && (
              <p className="text-destructive text-xs">{errors.estimated_sessions.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimated_total_price">Precio total estimado</Label>
            <Input
              id="estimated_total_price"
              inputMode="decimal"
              placeholder="1200000"
              {...register('estimated_total_price')}
            />
            {errors.estimated_total_price && (
              <p className="text-destructive text-xs">{errors.estimated_total_price.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <textarea
            id="description"
            rows={2}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('description')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reference_notes">Notas de referencia (opcional)</Label>
          <textarea
            id="reference_notes"
            rows={2}
            placeholder="Links a referencias, estilo, paleta…"
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            {...register('reference_notes')}
          />
        </div>

        {errors.root && (
          <p role="alert" className="text-destructive text-sm">
            {errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="rounded-full font-semibold"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creando…' : 'Crear proyecto'}
        </Button>
      </form>
    </main>
  );
}
