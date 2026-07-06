import { Layers, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/api';
import { PROJECT_STATUS_LABEL, projectProgress } from '../lib';
import { useProjects } from '../hooks';

const STATUS_STYLE: Record<Project['status'], string> = {
  planning: 'bg-accent text-accent-foreground',
  in_progress: 'bg-primary text-primary-foreground',
  on_hold: 'bg-muted text-muted-foreground',
  completed: 'bg-secondary text-secondary-foreground',
  canceled: 'bg-destructive/10 text-destructive',
};

function ProjectCard({ project }: { project: Project }) {
  const progress = projectProgress(project.completed_sessions, project.estimated_sessions);

  return (
    <Link
      to={`/proyectos/${project.id}`}
      className="bg-card hover:bg-accent/40 flex flex-col gap-3 rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{project.title}</p>
          <p className="text-muted-foreground truncate text-xs">
            {project.client_name} · {project.lead_artist_email}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
            STATUS_STYLE[project.status],
          )}
        >
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-muted-foreground shrink-0 text-xs font-medium">
          {project.completed_sessions}/{project.estimated_sessions ?? '?'} sesiones
        </span>
      </div>
    </Link>
  );
}

export function ProjectsPage() {
  const projects = useProjects();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Proyectos</h2>
          <p className="text-muted-foreground text-xs">
            Trabajos multi-sesión: mangas, espaldas, piezas grandes.
          </p>
        </div>
        <Button className="rounded-full font-semibold" asChild>
          <Link to="/proyectos/nuevo">
            <Plus /> Nuevo
          </Link>
        </Button>
      </header>

      {projects.isPending && <p className="text-muted-foreground text-sm">Cargando proyectos…</p>}
      {projects.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(projects.error)}
        </p>
      )}
      {projects.data?.length === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <Layers className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            Sin proyectos aún. Crea uno para agrupar las sesiones de una pieza grande.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {projects.data?.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    </main>
  );
}
