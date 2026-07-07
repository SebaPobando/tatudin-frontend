import { useState } from 'react';
import { addMonths, format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublicCalendar } from '../hooks';

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Calendario público sin PII: solo muestra qué días el estudio trabaja y
 * tiene disponibilidad — nunca nombres de clientes ni horarios de citas.
 */
export function PublicCalendarPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const calendar = usePublicCalendar(tenantSlug!, month);

  const monthDate = parse(month, 'yyyy-MM', new Date());
  const shiftMonth = (delta: number) => setMonth(format(addMonths(monthDate, delta), 'yyyy-MM'));

  // weekday del backend: 0=Lunes … 6=Domingo → offset del primer día
  const firstWeekday = calendar.data?.days[0]?.weekday ?? 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight capitalize">
          {format(monthDate, 'MMMM yyyy', { locale: es })}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Disponibilidad del estudio</p>
      </header>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Mes anterior"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl px-5 font-semibold"
          onClick={() => setMonth(format(new Date(), 'yyyy-MM'))}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Mes siguiente"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      {calendar.isPending && (
        <p className="text-muted-foreground text-center text-sm">Cargando calendario…</p>
      )}
      {calendar.isError && (
        <p role="alert" className="text-muted-foreground text-center text-sm">
          No pudimos cargar el calendario. Intenta de nuevo más tarde.
        </p>
      )}

      {calendar.data && (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_HEADERS.map((d) => (
              <p key={d} className="text-muted-foreground pb-1 text-center text-xs font-semibold">
                {d}
              </p>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {calendar.data.days.map((day) => (
              <div
                key={day.date}
                title={day.has_availability ? 'Con disponibilidad' : 'Sin disponibilidad'}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-xl border text-sm',
                  day.has_availability
                    ? 'bg-accent text-accent-foreground border-accent font-bold'
                    : day.is_working_day
                      ? 'bg-card'
                      : 'bg-muted/40 text-muted-foreground border-transparent',
                )}
              >
                {Number(day.date.slice(-2))}
              </div>
            ))}
          </div>

          <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="bg-accent size-3 rounded-full" /> Con disponibilidad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-muted size-3 rounded-full" /> Cerrado
            </span>
          </div>
        </>
      )}

      <p className="text-muted-foreground mt-auto pb-4 text-center text-xs">Hecho con Tatudin</p>
    </main>
  );
}
