import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import type { AnalyticsOverview, Appointment, Pnl } from '@/types/api';
import * as dashboardApi from '../api';
import { DashboardPage } from './DashboardPage';

vi.mock('../api');

const pnl: Pnl = {
  tenant_slug: 'estudio-scar',
  period: 'month',
  from: '2026-06-07',
  to: '2026-07-06',
  income: { total: '2450000.00', by_payment_method: [], by_artist: [] },
  expenses: { total: '0.00', by_category: [], by_payment_method: [] },
  net: '2450000.00',
  appointments_count: 12,
  expenses_count: 0,
};

const emptyOverview: AnalyticsOverview = {
  tenant_slug: 'estudio-scar',
  period: 'month',
  from: '2026-06-07',
  to: '2026-07-06',
  timezone: 'America/Bogota',
  appointments: {
    total: 14,
    completed: 12,
    canceled: 1,
    no_show: 1,
    pending: 0,
    no_show_rate: 0,
    cancel_rate: 0,
    completion_rate: 0,
    average_duration_hours: 0,
  },
  top_reasons: [],
  top_services: [],
  top_artists: [],
  client_sources: { new_clients_total: 0, breakdown: [] },
  forms_funnel: { submissions_total: 0, submissions_converted: 0, conversion_rate: 0 },
};

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: crypto.randomUUID(),
    artist_id: 'a1',
    artist_email: 'artist@tatudin.com',
    booth_id: null,
    booth_name: null,
    client_name: 'Cliente',
    client_phone: '',
    start_at: new Date().toISOString(),
    end_at: new Date().toISOString(),
    status: 'scheduled',
    notes: '',
    estimated_price: '0.00',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      status: 'authenticated',
      accessToken: 'a',
      user: {
        id: 'u1',
        email: 'scar@tatudin.com',
        username: 'scar',
        first_name: 'Scar',
        last_name: '',
        phone: '',
      },
    });
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio Scar', slug: 'estudio-scar', role: 'owner' },
    });
  });

  it('muestra solo las citas de HOY, excluyendo canceladas', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(dashboardApi.getAppointmentsFirstPage).mockResolvedValue({
      count: 3,
      next: null,
      previous: null,
      results: [
        appointment({ client_name: 'Julianne V.' }),
        appointment({ client_name: 'Cita de ayer', start_at: yesterday }),
        appointment({ client_name: 'Cancelada hoy', status: 'canceled' }),
      ],
    });
    vi.mocked(dashboardApi.getClientsCount).mockResolvedValue(84);
    vi.mocked(dashboardApi.getAnalyticsOverview).mockResolvedValue(emptyOverview);
    vi.mocked(dashboardApi.getPnl).mockResolvedValue(pnl);

    renderDashboard();

    expect(await screen.findByText('Julianne V.')).toBeInTheDocument();
    expect(screen.queryByText('Cita de ayer')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelada hoy')).not.toBeInTheDocument();
  });

  it('muestra el total de clientes del count paginado', async () => {
    vi.mocked(dashboardApi.getAppointmentsFirstPage).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(dashboardApi.getClientsCount).mockResolvedValue(84);
    vi.mocked(dashboardApi.getAnalyticsOverview).mockResolvedValue(emptyOverview);
    vi.mocked(dashboardApi.getPnl).mockResolvedValue(pnl);

    renderDashboard();

    expect(await screen.findByText('84')).toBeInTheDocument();
    expect(await screen.findByText(/no tienes citas hoy/i)).toBeInTheDocument();
  });

  it('owner ve trabajos del mes desde analytics', async () => {
    vi.mocked(dashboardApi.getAppointmentsFirstPage).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(dashboardApi.getClientsCount).mockResolvedValue(0);
    vi.mocked(dashboardApi.getAnalyticsOverview).mockResolvedValue(emptyOverview);
    vi.mocked(dashboardApi.getPnl).mockResolvedValue(pnl);

    renderDashboard();

    expect(await screen.findByText('12')).toBeInTheDocument();
  });

  it('artist NO dispara la query de analytics (403 evitado)', async () => {
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio Scar', slug: 'estudio-scar', role: 'artist' },
    });
    vi.mocked(dashboardApi.getAppointmentsFirstPage).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(dashboardApi.getClientsCount).mockResolvedValue(0);

    renderDashboard();

    expect(await screen.findByText(/no tienes citas hoy/i)).toBeInTheDocument();
    expect(dashboardApi.getAnalyticsOverview).not.toHaveBeenCalled();
    expect(dashboardApi.getPnl).not.toHaveBeenCalled();
  });

  it('owner ve los ingresos del P&L formateados', async () => {
    vi.mocked(dashboardApi.getAppointmentsFirstPage).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(dashboardApi.getClientsCount).mockResolvedValue(0);
    vi.mocked(dashboardApi.getAnalyticsOverview).mockResolvedValue(emptyOverview);
    vi.mocked(dashboardApi.getPnl).mockResolvedValue(pnl);

    renderDashboard();

    // formatMoney usa es-CO/COP: el monto formateado contiene 2.450.000
    expect(await screen.findByText(/2\.450\.000/)).toBeInTheDocument();
  });
});
