import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { AnalyticsOverview, Role } from '@/types/api';
import * as analyticsApi from '../api';
import { AnalyticsPage } from './AnalyticsPage';

vi.mock('../api');

function overview(): AnalyticsOverview {
  return {
    tenant_slug: 'estudio',
    period: 'month',
    from: '2026-06-01',
    to: '2026-06-30',
    timezone: 'America/Bogota',
    appointments: {
      total: 20,
      completed: 15,
      canceled: 3,
      no_show: 2,
      pending: 0,
      no_show_rate: 0.1,
      cancel_rate: 0.15,
      completion_rate: 0.75,
      average_duration_hours: 2.5,
    },
    top_reasons: [],
    top_services: [],
    top_artists: [],
    client_sources: { new_clients_total: 8, breakdown: [] },
    forms_funnel: { submissions_total: 10, submissions_converted: 4, conversion_rate: 0.4 },
  };
}

function renderPage(role: Role = 'owner') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useTenantStore.setState({
    activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/analytics']}>
        <AnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getByDayOfWeek).mockResolvedValue({
      tenant_slug: 'estudio',
      period: 'month',
      from: '2026-06-01',
      to: '2026-06-30',
      timezone: 'America/Bogota',
      days: [],
    });
    vi.mocked(analyticsApi.getByArtist).mockResolvedValue({
      tenant_slug: 'estudio',
      period: 'month',
      from: '2026-06-01',
      to: '2026-06-30',
      artists: [],
    });
    vi.mocked(analyticsApi.getFunnel).mockResolvedValue({
      tenant_slug: 'estudio',
      period: 'month',
      from: '2026-06-01',
      to: '2026-06-30',
      overall: {
        submissions_total: 0,
        pending_count: 0,
        reviewed_count: 0,
        converted_count: 0,
        archived_count: 0,
        conversion_rate: 0,
      },
      by_template: [],
    });
  });

  it('muestra KPIs del overview con tasas formateadas', async () => {
    vi.mocked(analyticsApi.getOverview).mockResolvedValue(overview());
    renderPage('owner');

    expect(await screen.findByText('20')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('2.5 h')).toBeInTheDocument();
  });

  it('el toggle de período refetchea con ?period', async () => {
    vi.mocked(analyticsApi.getOverview).mockResolvedValue(overview());
    const user = userEvent.setup();
    renderPage('owner');

    await screen.findByText('Analytics');
    await user.click(screen.getByRole('tab', { name: /semana/i }));

    await waitFor(() => {
      const calls = vi.mocked(analyticsApi.getOverview).mock.calls;
      expect(calls.some(([p]) => p === 'week')).toBe(true);
    });
  });

  it('renderiza "por artista" con el email y su conteo', async () => {
    vi.mocked(analyticsApi.getOverview).mockResolvedValue(overview());
    vi.mocked(analyticsApi.getByArtist).mockResolvedValue({
      tenant_slug: 'estudio',
      period: 'month',
      from: '2026-06-01',
      to: '2026-06-30',
      artists: [
        {
          artist_id: 'a1',
          artist_email: 'vale@estudio.com',
          appointments_count: 9,
          completed_count: 5,
          canceled_count: 1,
          no_show_count: 0,
          completion_rate: 0.55,
          total_hours_worked: 20,
          average_duration_hours: 2.2,
        },
      ],
    });
    renderPage('owner');

    expect(await screen.findByText('vale@estudio.com')).toBeInTheDocument();
  });

  it('bloquea a roles no staff', async () => {
    vi.mocked(analyticsApi.getOverview).mockResolvedValue(overview());
    renderPage('artist');

    expect(await screen.findByText(/solo para owner y admin/i)).toBeInTheDocument();
  });
});
