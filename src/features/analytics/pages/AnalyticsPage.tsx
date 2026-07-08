import { useState } from 'react';
import {
  CalendarCheck2,
  CalendarX2,
  Clock,
  TrendingUp,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { getApiErrorMessage } from '@/api/errors';
import { useTenantStore } from '@/stores/tenant';
import { cn } from '@/lib/utils';
import type { AnalyticsPeriod } from '@/types/api';
import { PERIOD_LABEL, PERIOD_OPTIONS, formatRate } from '../lib';
import { useByArtist, useByDayOfWeek, useFunnel, useOverview } from '../hooks';

function PeriodToggle({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (p: AnalyticsPeriod) => void;
}) {
  return (
    <div className="bg-muted inline-flex rounded-full p-1" role="tablist" aria-label="Período">
      {PERIOD_OPTIONS.map((p) => (
        <button
          key={p}
          role="tab"
          aria-selected={value === p}
          onClick={() => onChange(p)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            value === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
          )}
        >
          {PERIOD_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

/** Barra horizontal simple; `value` es 0..max. */
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground w-10 shrink-0 text-xs">{label}</span>
      <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-medium">{value}</span>
    </div>
  );
}

export function AnalyticsPage() {
  const role = useTenantStore((s) => s.activeTenant?.role);
  const isStaff = role === 'owner' || role === 'admin';
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const overview = useOverview(period);
  const byDay = useByDayOfWeek(period);
  const byArtist = useByArtist(period);
  const funnel = useFunnel(period);

  if (!isStaff) {
    return (
      <main className="mx-auto w-full max-w-2xl p-6">
        <p className="text-muted-foreground text-sm">
          Analytics está disponible solo para owner y admin.
        </p>
      </main>
    );
  }

  const ov = overview.data;

  // ── Por día de la semana ───────────────────────────────────────
  const dayBuckets = (byDay.data?.days ?? []).map((d) => ({
    label: d.day_name.slice(0, 3),
    value: d.appointments_count,
  }));
  const dayMax = Math.max(1, ...dayBuckets.map((d) => d.value));
  const hasDayData = dayBuckets.some((d) => d.value > 0);

  // ── Por artista (orden desc por citas) ─────────────────────────
  const artistRows = (byArtist.data?.artists ?? [])
    .map((a) => ({ label: a.artist_email, value: a.appointments_count }))
    .sort((a, b) => b.value - a.value);
  const artistMax = Math.max(1, ...artistRows.map((a) => a.value));

  // ── Funnel: endpoint dedicado (overall), con fallback al overview ──
  const funnelTotal =
    funnel.data?.overall.submissions_total ?? ov?.forms_funnel.submissions_total ?? 0;
  const funnelConverted =
    funnel.data?.overall.converted_count ?? ov?.forms_funnel.submissions_converted ?? 0;
  const funnelRate =
    funnel.data?.overall.conversion_rate ?? ov?.forms_funnel.conversion_rate ?? undefined;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground text-xs">Rendimiento de tu estudio por período.</p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </header>

      {overview.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(overview.error)}
        </p>
      )}
      {overview.isPending && <p className="text-muted-foreground text-sm">Cargando métricas…</p>}

      {ov && (
        <>
          <section aria-label="Resumen" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={CalendarCheck2}
              label="Citas"
              value={String(ov.appointments.total)}
              description={`${ov.appointments.completed} completadas`}
            />
            <StatCard
              icon={TrendingUp}
              label="Tasa de completado"
              value={formatRate(ov.appointments.completion_rate)}
              description="Citas que terminaron en sesión"
              tone="primary"
            />
            <StatCard
              icon={CalendarX2}
              label="Cancelación"
              value={formatRate(ov.appointments.cancel_rate)}
              description={`${ov.appointments.canceled} canceladas`}
            />
            <StatCard
              icon={UserRoundX}
              label="No-show"
              value={formatRate(ov.appointments.no_show_rate)}
              description={`${ov.appointments.no_show} no asistieron`}
            />
            <StatCard
              icon={Clock}
              label="Duración media"
              value={`${ov.appointments.average_duration_hours.toFixed(1)} h`}
              description="Por sesión"
            />
            <StatCard
              icon={UsersRound}
              label="Clientes nuevos"
              value={String(ov.client_sources.new_clients_total)}
              description="Captados en el período"
              tone="primary"
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formularios → Citas</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{funnelTotal}</p>
                <p className="text-muted-foreground text-xs">Enviados</p>
              </div>
              <TrendingUp className="text-muted-foreground size-5 shrink-0" />
              <div className="text-center">
                <p className="text-3xl font-bold">{funnelConverted}</p>
                <p className="text-muted-foreground text-xs">Convertidos</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-primary text-3xl font-bold">{formatRate(funnelRate)}</p>
                <p className="text-muted-foreground text-xs">Conversión</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Días de la semana</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {byDay.isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}
          {byDay.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getApiErrorMessage(byDay.error)}
            </p>
          )}
          {byDay.data && !hasDayData && (
            <p className="text-muted-foreground text-sm">Sin datos en este período.</p>
          )}
          {byDay.data &&
            hasDayData &&
            dayBuckets.map((d) => <Bar key={d.label} label={d.label} value={d.value} max={dayMax} />)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por artista</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {byArtist.isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}
          {byArtist.isError && (
            <p role="alert" className="text-destructive text-sm">
              {getApiErrorMessage(byArtist.error)}
            </p>
          )}
          {byArtist.data && artistRows.length === 0 && (
            <p className="text-muted-foreground text-sm">Sin datos en este período.</p>
          )}
          {artistRows.map((a) => (
            <Bar key={a.label} label={a.label} value={a.value} max={artistMax} />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
