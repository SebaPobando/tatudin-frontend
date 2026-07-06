import { addDays, addWeeks, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Tira semanal de los mockups: lunes a domingo, día seleccionado en tile
 * oscuro, flechas para cambiar de semana y pill "Hoy".
 */
export function WeekStrip({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
}) {
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl"
          aria-label="Semana anterior"
          onClick={() => onSelect(addWeeks(selected, -1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl px-5 font-semibold"
          onClick={() => onSelect(new Date())}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl"
          aria-label="Semana siguiente"
          onClick={() => onSelect(addWeeks(selected, 1))}
        >
          <ChevronRight />
        </Button>
        <p className="text-muted-foreground ml-auto text-sm font-medium capitalize">
          {format(selected, 'MMMM yyyy', { locale: es })}
        </p>
      </div>

      <ul className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          return (
            <li key={day.toISOString()}>
              <button
                type="button"
                onClick={() => onSelect(day)}
                aria-pressed={active}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-2xl border py-2.5 transition-colors',
                  active
                    ? 'bg-secondary text-secondary-foreground border-secondary'
                    : 'bg-card hover:bg-accent',
                )}
              >
                <span className="text-[10px] font-medium uppercase">
                  {format(day, 'EEE', { locale: es })}
                </span>
                <span className="text-lg font-bold">{format(day, 'dd')}</span>
                {isToday(day) && (
                  <span
                    className={cn('size-1.5 rounded-full', active ? 'bg-primary' : 'bg-primary/70')}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
