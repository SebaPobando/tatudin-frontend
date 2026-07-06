import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarPlus, CheckCircle2, Pause, Play } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import { AppointmentCard } from '../components/AppointmentCard';
import { PROJECT_STATUS_LABEL, projectProgress } from '../lib';
import { useCompleteProject, useProject, useProjectSessions, useUpdateProject } from '../hooks';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProject(id!);
  const sessions = useProjectSessions(id!);
  const updateMutation = useUpdateProject(id!);
  const completeMutation = useCompleteProject(id!);

  if (project.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando proyecto…</p>;
  }
  if (project.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(project.error)}
      </p>
    );
  }

  const p = project.data;
  const progress = projectProgress(p.completed_sessions, p.estimated_sessions);
  const active = p.status === 'planning' || p.status === 'in_progress' || p.status === 'on_hold';

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/proyectos" aria-label="Volver a proyectos">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">{p.title}</h2>
          <p className="text-muted-foreground text-xs">
            {p.client_name} · {PROJECT_STATUS_LABEL[p.status]}
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
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
              {p.completed_sessions}/{p.estimated_sessions ?? '?'}
            </span>
          </div>
          <Row label="Artista">{p.lead_artist_email}</Row>
          {p.estimated_total_price && (
            <Row label="Precio estimado">{formatMoney(p.estimated_total_price)}</Row>
          )}
          {p.next_session_at && (
            <Row label="Próxima sesión">
              {format(parseISO(p.next_session_at), "d 'de' MMM, HH:mm", { locale: es })}
            </Row>
          )}
          {p.description && <Row label="Descripción">{p.description}</Row>}
          {p.reference_notes && <Row label="Referencias">{p.reference_notes}</Row>}
        </CardContent>
      </Card>

      {(updateMutation.isError || completeMutation.isError) && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(updateMutation.error ?? completeMutation.error)}
        </p>
      )}

      {active && (
        <div className="flex flex-col gap-2">
          <Button
            className="rounded-full font-semibold"
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            <CheckCircle2 />
            {completeMutation.isPending ? 'Cerrando…' : 'Completar proyecto'}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({ status: p.status === 'on_hold' ? 'in_progress' : 'on_hold' })
            }
          >
            {p.status === 'on_hold' ? (
              <>
                <Play /> Reanudar
              </>
            ) : (
              <>
                <Pause /> Pausar
              </>
            )}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Sesiones</CardTitle>
          {active && (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link to="/agenda/nueva">
                <CalendarPlus /> Nueva sesión
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sessions.isPending && (
            <p className="text-muted-foreground text-sm">Cargando sesiones…</p>
          )}
          {sessions.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Sin sesiones vinculadas. Al crear una cita, elígelo en el campo “Proyecto”.
            </p>
          )}
          {sessions.data?.map((a) => (
            <AppointmentCard key={a.id} appointment={a} />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
