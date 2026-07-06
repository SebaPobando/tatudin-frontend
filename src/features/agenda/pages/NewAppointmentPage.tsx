import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { AppointmentForm } from '../components/AppointmentForm';
import { applyServerErrors, valuesToPayload } from '../lib';
import { useCreateAppointment } from '../hooks';

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateAppointment();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/agenda" aria-label="Volver a la agenda">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nueva cita</h2>
          <p className="text-muted-foreground text-xs">
            Owner/admin pueden agendar para cualquier artista
          </p>
        </div>
      </header>

      <AppointmentForm
        submitLabel="Crear cita"
        pending={createMutation.isPending}
        onSubmit={(values, setError) => {
          if (!user) return;
          createMutation.mutate(valuesToPayload(values, values.artist_id || user.id), {
            onSuccess: () => navigate('/agenda'),
            onError: (error) => applyServerErrors(error, setError),
          });
        }}
      />
    </main>
  );
}
