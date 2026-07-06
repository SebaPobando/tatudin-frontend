import { CalendarCheck2, ChevronRight, Plus, UsersRound, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/auth';
import type { Appointment } from '@/types/api';
import { formatMoney } from '@/lib/money';
import { useAnalyticsOverview, useClientsCount, usePnl, useTodayAppointments } from '../hooks';

const STATUS_LABEL: Record<Appointment['status'], string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  in_progress: 'En sesión',
  completed: 'Completada',
  canceled: 'Cancelada',
  no_show: 'No asistió',
};

function TodayAppointmentItem({ appointment }: { appointment: Appointment }) {
  return (
    <li className="bg-accent/40 flex items-center gap-4 rounded-xl p-4">
      <div className="min-w-14 text-center">
        <p className="text-lg font-bold">{format(parseISO(appointment.start_at), 'HH:mm')}</p>
        <p className="text-muted-foreground text-[10px] uppercase">
          {format(parseISO(appointment.start_at), 'a', { locale: es })}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{appointment.client_name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {appointment.booth_name ?? 'Sin cabina'} · {STATUS_LABEL[appointment.status]}
        </p>
      </div>
      {appointment.status === 'in_progress' && (
        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold">
          En sesión
        </span>
      )}
    </li>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const today = useTodayAppointments();
  const clients = useClientsCount();
  const overview = useAnalyticsOverview('month');
  const pnl = usePnl('month');

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Everything ready for today</h2>
        <p className="text-muted-foreground mt-1">
          Hola, {user?.first_name || user?.email}. Este es el estado de tu estudio.
        </p>
      </header>

      <div className="flex gap-3">
        <Button className="rounded-full font-semibold" asChild>
          <Link to="/agenda">
            <Plus /> Nueva cita
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-1">
            Citas de hoy <ChevronRight className="size-4" />
          </CardTitle>
          <span className="text-muted-foreground text-sm">
            {today.data
              ? `${today.data.length} programada${today.data.length === 1 ? '' : 's'}`
              : '…'}
          </span>
        </CardHeader>
        <CardContent>
          {today.isPending && <p className="text-muted-foreground text-sm">Cargando agenda…</p>}
          {today.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getApiErrorMessage(today.error)}
            </p>
          )}
          {today.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No tienes citas hoy. Día de flash, bocetos… o descanso.
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {today.data?.map((a) => (
              <TodayAppointmentItem key={a.id} appointment={a} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <section aria-label="Métricas" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={CalendarCheck2}
          label="Citas hoy"
          value={today.data ? String(today.data.length) : '—'}
          description="Agenda programada"
        />
        <StatCard
          icon={UsersRound}
          label="Clientes"
          value={clients.data !== undefined ? String(clients.data) : '—'}
          description="Base de datos total"
          tone="primary"
        />
        <StatCard
          icon={CalendarCheck2}
          label="Trabajos del mes"
          value={overview.data ? String(overview.data.appointments.completed) : '—'}
          description={overview.data ? 'Citas completadas en el período' : 'Solo owner/admin'}
        />
        <StatCard
          icon={Wallet}
          label="Ingresos"
          value={pnl.data ? formatMoney(pnl.data.income.total) : '—'}
          description={pnl.data ? 'Ingresos del período (30 días)' : 'Solo owner/admin'}
        />
      </section>
    </main>
  );
}
