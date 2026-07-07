import { CalendarCheck2, Flame, Palette, Timer } from 'lucide-react';
import { useParams } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { usePublicStats } from '../hooks';

function StatBlock({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </span>
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}

/** Stats públicas tipo "Wrapped" — agregadas, sin PII. */
export function PublicStatsPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const stats = usePublicStats(tenantSlug!);

  if (stats.isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-muted-foreground animate-pulse text-sm">Cargando…</p>
      </main>
    );
  }
  if (stats.isError) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <p role="alert" className="text-muted-foreground text-sm">
          No pudimos cargar las estadísticas.
        </p>
      </main>
    );
  }

  const s = stats.data;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">El último mes en el estudio</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {s.from} → {s.to}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <StatBlock
          icon={Flame}
          value={`${s.busy_days_percentage}%`}
          label="De los días con agenda ocupada"
        />
        <StatBlock
          icon={CalendarCheck2}
          value={String(s.total_appointments_count)}
          label="Sesiones agendadas"
        />
        <StatBlock
          icon={Timer}
          value={`${Math.round(s.total_available_hours)}h`}
          label="Horas aún disponibles"
        />
        <StatBlock icon={Palette} value={String(s.active_artists_count)} label="Artistas activos" />
      </section>

      <p className="text-muted-foreground mt-auto pb-4 text-center text-xs">Hecho con Tatudin</p>
    </main>
  );
}
