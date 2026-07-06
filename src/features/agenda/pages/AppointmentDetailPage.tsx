import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getApiErrorMessage } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import type { AppointmentStatus } from '@/types/api';
import { ParticipantsCard } from '../components/ParticipantsCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAppointment, useUpdateAppointment } from '../hooks';

/** Transiciones disponibles según el estado actual (mockup detail actions). */
const TRANSITIONS: Partial<
  Record<
    AppointmentStatus,
    { to: AppointmentStatus; label: string; variant: 'default' | 'outline' }[]
  >
> = {
  scheduled: [
    { to: 'confirmed', label: 'Confirmar', variant: 'default' },
    { to: 'no_show', label: 'No asistió', variant: 'outline' },
  ],
  confirmed: [
    { to: 'in_progress', label: 'Iniciar sesión', variant: 'default' },
    { to: 'no_show', label: 'No asistió', variant: 'outline' },
  ],
  in_progress: [{ to: 'completed', label: 'Completar', variant: 'default' }],
};

const CANCELABLE: AppointmentStatus[] = ['scheduled', 'confirmed', 'in_progress'];

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appointment = useAppointment(id!);
  const updateMutation = useUpdateAppointment(id!);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const setStatus = (status: AppointmentStatus) =>
    updateMutation.mutate(
      { status },
      { onSuccess: () => status === 'canceled' && navigate('/agenda') },
    );

  if (appointment.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando cita…</p>;
  }
  if (appointment.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(appointment.error)}
      </p>
    );
  }

  const a = appointment.data;
  const start = parseISO(a.start_at);
  const transitions = TRANSITIONS[a.status] ?? [];
  const editable = a.status === 'scheduled' || a.status === 'confirmed';

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/agenda" aria-label="Volver a la agenda">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">{a.client_name}</h2>
          <p className="text-muted-foreground text-xs capitalize">
            {format(start, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Row label="Horario">
            {format(start, 'HH:mm')} – {format(parseISO(a.end_at), 'HH:mm')}
          </Row>
          <Row label="Cabina">{a.booth_name ?? 'Sin cabina'}</Row>
          <Row label="Artista">{a.artist_email}</Row>
          {a.reason_name && <Row label="Motivo">{a.reason_name}</Row>}
          {a.service_name && <Row label="Servicio">{a.service_name}</Row>}
          {a.is_group && a.total_price && (
            <Row label="Total grupal">{formatMoney(a.total_price)}</Row>
          )}
          {a.client_phone && <Row label="Teléfono">{a.client_phone}</Row>}
          {a.estimated_price && <Row label="Precio estimado">{formatMoney(a.estimated_price)}</Row>}
          {a.notes && <Row label="Notas">{a.notes}</Row>}
        </CardContent>
      </Card>

      <ParticipantsCard
        appointmentId={a.id}
        canAdd={a.status === 'scheduled' || a.status === 'confirmed'}
      />

      {updateMutation.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(updateMutation.error)}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {transitions.map((t) => (
          <Button
            key={t.to}
            variant={t.variant}
            className="rounded-full font-semibold"
            disabled={updateMutation.isPending}
            onClick={() => setStatus(t.to)}
          >
            {t.label}
          </Button>
        ))}

        {editable && (
          <Button variant="outline" className="rounded-full" asChild>
            <Link to={`/agenda/${a.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </Button>
        )}

        {CANCELABLE.includes(a.status) &&
          (confirmingCancel ? (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1 rounded-full font-semibold"
                disabled={updateMutation.isPending}
                onClick={() => setStatus('canceled')}
              >
                Sí, cancelar cita
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setConfirmingCancel(false)}
              >
                Volver
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="text-destructive rounded-full"
              onClick={() => setConfirmingCancel(true)}
            >
              Cancelar cita
            </Button>
          ))}
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
