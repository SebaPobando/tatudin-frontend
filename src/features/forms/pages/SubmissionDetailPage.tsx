import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Archive, ArrowLeft, CheckCheck } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/api/errors';
import { SUBMISSION_STATUS_LABEL } from '../lib';
import { useMarkReviewed, useSubmission, useUpdateSubmission } from '../hooks';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium break-all">{children}</span>
    </div>
  );
}

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const submission = useSubmission(id!);
  const markReviewedMutation = useMarkReviewed(id!);
  const updateMutation = useUpdateSubmission(id!);
  const [notes, setNotes] = useState<string | null>(null);

  if (submission.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando entrada…</p>;
  }
  if (submission.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(submission.error)}
      </p>
    );
  }

  const s = submission.data;
  const notesValue = notes ?? s.reviewer_notes ?? '';

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/formularios/entradas" aria-label="Volver a entradas">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">
            {s.visitor_name || s.visitor_email || 'Visitante'}
          </h2>
          <p className="text-muted-foreground text-xs capitalize">
            {s.template_name} ·{' '}
            {format(parseISO(s.created_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </p>
        </div>
        <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
          {SUBMISSION_STATUS_LABEL[s.status]}
        </span>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {s.visitor_email && <Row label="Email">{s.visitor_email}</Row>}
          {s.visitor_phone && <Row label="Teléfono">{s.visitor_phone}</Row>}
          {s.client_name && <Row label="Cliente vinculado">{s.client_name}</Row>}
          {!s.visitor_email && !s.visitor_phone && (
            <p className="text-muted-foreground">Sin datos de contacto.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Respuestas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {s.answers.length === 0 && <p className="text-muted-foreground">Sin respuestas.</p>}
          {s.answers.map((a) => (
            <div key={a.id}>
              <p className="text-muted-foreground text-xs">{a.field_label}</p>
              <p className="font-medium break-words">{a.value || '—'}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas del equipo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            aria-label="Notas del revisor"
            placeholder="Ej: le respondí por WhatsApp el martes"
            value={notesValue}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            className="self-end rounded-full"
            disabled={updateMutation.isPending || notes === null || notes === s.reviewer_notes}
            onClick={() => updateMutation.mutate({ reviewer_notes: notesValue })}
          >
            Guardar notas
          </Button>
        </CardContent>
      </Card>

      {(markReviewedMutation.isError || updateMutation.isError) && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(markReviewedMutation.error ?? updateMutation.error)}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {s.status === 'pending' && (
          <Button
            className="rounded-full font-semibold"
            disabled={markReviewedMutation.isPending}
            onClick={() => markReviewedMutation.mutate()}
          >
            <CheckCheck /> Marcar como revisado
          </Button>
        )}
        {/* TODO: convert-to-appointment — body del POST sin confirmar aún */}
        {s.status !== 'archived' && s.status !== 'converted' && (
          <Button
            variant="ghost"
            className="text-muted-foreground rounded-full"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ status: 'archived' })}
          >
            <Archive /> Archivar
          </Button>
        )}
      </div>

      {s.reviewer_email && (
        <p className="text-muted-foreground text-center text-xs">
          Revisado por {s.reviewer_email}
          {s.reviewed_at && ` · ${format(parseISO(s.reviewed_at), 'dd/MM/yyyy HH:mm')}`}
        </p>
      )}
    </main>
  );
}
