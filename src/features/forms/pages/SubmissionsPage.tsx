import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { cn } from '@/lib/utils';
import type { SubmissionStatus } from '@/types/api';
import { SUBMISSION_STATUS_LABEL } from '../lib';
import { useSubmissions } from '../hooks';

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: 'bg-primary text-primary-foreground',
  reviewed: 'bg-accent text-accent-foreground',
  converted: 'bg-secondary text-secondary-foreground',
  archived: 'bg-muted text-muted-foreground',
};

export function SubmissionsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const submissions = useSubmissions({ status, page });

  const totalPages = submissions.data ? Math.max(1, Math.ceil(submissions.data.count / 25)) : 1;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/formularios" aria-label="Volver a formularios">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Entradas</h2>
          <p className="text-muted-foreground text-xs">
            Respuestas de tus formularios públicos — futuros clientes tocando la puerta.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <Button
          variant={status === '' ? 'secondary' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => {
            setStatus('');
            setPage(1);
          }}
        >
          Todas
        </Button>
        {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) => (
          <Button
            key={s}
            variant={status === s ? 'secondary' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {SUBMISSION_STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      {submissions.isPending && <p className="text-muted-foreground text-sm">Cargando entradas…</p>}
      {submissions.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(submissions.error)}
        </p>
      )}
      {submissions.data?.count === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <Inbox className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            {status
              ? 'Nada con ese estado.'
              : 'Sin entradas aún. Llegarán desde tus formularios públicos (Fase 11).'}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {submissions.data?.results.map((s) => (
          <li key={s.id}>
            <Link
              to={`/formularios/entradas/${s.id}`}
              className="bg-card hover:bg-accent/40 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {s.visitor_name || s.visitor_email || 'Visitante anónimo'}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {s.template_name} · {format(parseISO(s.created_at), 'dd/MM/yyyy HH:mm')}
                  {s.client_name && ` · cliente: ${s.client_name}`}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                  STATUS_STYLE[s.status],
                )}
              >
                {SUBMISSION_STATUS_LABEL[s.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {submissions.data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Página siguiente"
            disabled={!submissions.data.next}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </main>
  );
}
