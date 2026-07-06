import { format, parseISO } from 'date-fns';
import { Link } from 'react-router';
import type { Appointment } from '@/types/api';
import { StatusBadge } from './StatusBadge';

/** Card de cita de la vista de día, con hora, cliente y estado. */
export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Link
      to={`/agenda/${appointment.id}`}
      className="bg-card hover:bg-accent/40 flex items-center gap-4 rounded-lg border p-4 transition-colors"
    >
      <div className="min-w-16 text-center">
        <p className="text-lg font-bold">{format(parseISO(appointment.start_at), 'HH:mm')}</p>
        <p className="text-muted-foreground text-xs">
          {format(parseISO(appointment.end_at), 'HH:mm')}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{appointment.client_name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {appointment.booth_name ?? 'Sin cabina'}
          {appointment.notes ? ` · ${appointment.notes}` : ''}
        </p>
      </div>
      <StatusBadge status={appointment.status} />
    </Link>
  );
}
