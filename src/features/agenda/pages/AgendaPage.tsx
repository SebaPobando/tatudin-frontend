import { useState } from 'react';
import { isSameDay, parseISO } from 'date-fns';
import { Plus, Settings2 } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import { AppointmentCard } from '../components/AppointmentCard';
import { WeekStrip } from '../components/WeekStrip';
import { useAllAppointments } from '../hooks';

export function AgendaPage() {
  const [selected, setSelected] = useState(() => new Date());
  const appointments = useAllAppointments();
  const role = useTenantStore((s) => s.activeTenant?.role);
  const isStaff = role === 'owner' || role === 'admin';

  const dayAppointments = (appointments.data ?? [])
    .filter((a) => isSameDay(parseISO(a.start_at), selected))
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
        <div className="flex items-center gap-2">
          {isStaff && (
            <Button variant="outline" size="icon" className="rounded-full" asChild>
              <Link to="/agenda/ajustes" aria-label="Ajustes de agenda">
                <Settings2 />
              </Link>
            </Button>
          )}
          <Button className="rounded-full font-semibold" asChild>
            <Link to="/agenda/nueva">
              <Plus /> Nueva cita
            </Link>
          </Button>
        </div>
      </header>

      <WeekStrip selected={selected} onSelect={setSelected} />

      {appointments.isPending && <p className="text-muted-foreground text-sm">Cargando agenda…</p>}
      {appointments.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(appointments.error)}
        </p>
      )}
      {appointments.data && dayAppointments.length === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin citas este día. Toca “Nueva cita” para agendar.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {dayAppointments.map((a) => (
          <li key={a.id}>
            <AppointmentCard appointment={a} />
          </li>
        ))}
      </ul>
    </main>
  );
}
