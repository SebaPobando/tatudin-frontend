import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { IntegrationConnection, Role } from '@/types/api';
import * as integrationsApi from '../api';
import { IntegrationsPage } from './IntegrationsPage';

vi.mock('../api');

function connection(overrides: Partial<IntegrationConnection> = {}): IntegrationConnection {
  return {
    id: 'c1',
    provider: 'google_calendar',
    status: 'active',
    config: {},
    has_secret: true,
    last_used_at: null,
    last_error: '',
    created_at: '2026-07-07T10:00:00Z',
    updated_at: '',
    ...overrides,
  };
}

function emptyPage() {
  return { count: 0, next: null, previous: null, results: [] };
}

function renderPage(role: Role = 'owner') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useTenantStore.setState({
    activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/integraciones']}>
        <IntegrationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('IntegrationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(integrationsApi.getNotifications).mockResolvedValue(emptyPage());
  });

  it('lista conexiones con proveedor y estado', async () => {
    vi.mocked(integrationsApi.getConnections).mockResolvedValue([connection()]);
    renderPage();

    expect(await screen.findByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText(/^activa$/i)).toBeInTheDocument();
    expect(screen.getByText(/secret configurado/i)).toBeInTheDocument();
  });

  it('el form de crear excluye proveedores ya conectados', async () => {
    vi.mocked(integrationsApi.getConnections).mockResolvedValue([connection()]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /conectar/i }));
    const providerSelect = screen.getByLabelText(/proveedor/i);
    // google_calendar ya está tomado → no debe aparecer como opción
    expect(within(providerSelect).queryByRole('option', { name: 'Google Calendar' })).toBeNull();
    expect(within(providerSelect).getByRole('option', { name: /twilio/i })).toBeInTheDocument();
  });

  it('crea una conexión parseando la config JSON', async () => {
    vi.mocked(integrationsApi.getConnections).mockResolvedValue([]);
    vi.mocked(integrationsApi.createConnection).mockResolvedValue(connection());
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /conectar/i }));
    await user.type(screen.getByLabelText(/config/i), '{{"calendar_id": "abc"}');
    await user.type(screen.getByLabelText(/secret/i), 'tok_123');
    await user.click(screen.getByRole('button', { name: /^conectar$/i }));

    await waitFor(() => {
      expect(integrationsApi.createConnection).toHaveBeenCalledTimes(1);
    });
    const payload = vi.mocked(integrationsApi.createConnection).mock.calls[0][0];
    expect(payload.provider).toBe('google_calendar');
    expect(payload.config).toEqual({ calendar_id: 'abc' });
    expect(payload.secret).toBe('tok_123');
  });

  it('bloquea a roles no staff', async () => {
    vi.mocked(integrationsApi.getConnections).mockResolvedValue([]);
    renderPage('receptionist');

    expect(await screen.findByText(/solo para owner y admin/i)).toBeInTheDocument();
  });
});
