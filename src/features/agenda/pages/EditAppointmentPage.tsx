import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { AppointmentForm } from '../components/AppointmentForm';
import { applyServerErrors, appointmentToValues, valuesToPayload } from '../lib';
import { useAppointment, useUpdateAppointment } from '../hooks';

export function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appointment = useAppointment(id!);
  const updateMutation = useUpdateAppointment(id!);

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

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to={`/agenda/${a.id}`} aria-label="Volver al detalle">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Editar cita</h2>
      </header>

      <AppointmentForm
        defaultValues={appointmentToValues(a)}
        submitLabel="Guardar cambios"
        pending={updateMutation.isPending}
        onSubmit={(values, setError) => {
          // PATCH sin artist_id: no cambiamos el dueño de la cita al editar
          const { artist_id: _artist_id, ...payload } = valuesToPayload(values, a.artist_id);
          updateMutation.mutate(payload, {
            onSuccess: () => navigate(`/agenda/${a.id}`),
            onError: (error) => applyServerErrors(error, setError),
          });
        }}
      />
    </main>
  );
}
