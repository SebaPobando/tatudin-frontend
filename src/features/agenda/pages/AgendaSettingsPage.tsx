import { ArrowLeft, ChevronRight, Clock, DoorOpen, Tags } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    to: '/agenda/cabinas',
    icon: DoorOpen,
    title: 'Cabinas',
    description: 'Espacios físicos — el backend impide solapamientos por cabina',
  },
  {
    to: '/agenda/motivos',
    icon: Tags,
    title: 'Motivos de cita',
    description: 'Clasificación con color — alimenta analytics',
  },
  {
    to: '/agenda/horarios',
    icon: Clock,
    title: 'Horarios de trabajo',
    description: 'Del estudio o por artista — definen los slots públicos',
  },
];

/** Hub de configuración de la agenda (solo owner/admin llega aquí). */
export function AgendaSettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/agenda" aria-label="Volver a la agenda">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Ajustes de agenda</h2>
      </header>

      <ul className="bg-card divide-border divide-y rounded-lg border">
        {SECTIONS.map(({ to, icon: Icon, title, description }) => (
          <li key={to}>
            <Link
              to={to}
              className="hover:bg-accent/50 flex items-center gap-4 px-4 py-4 transition-colors"
            >
              <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="text-muted-foreground block truncate text-xs">{description}</span>
              </span>
              <ChevronRight className="text-muted-foreground size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
