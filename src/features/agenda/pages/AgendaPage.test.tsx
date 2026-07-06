import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Appointment } from '@/types/api';
import * as agendaApi from '../api';
import { AgendaPage } from './AgendaPage';

vi.mock('../api');

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

function renderAgenda() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/agenda']}>
        <AgendaPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AgendaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('muestra solo las citas del día seleccionado (hoy por defecto)', async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(agendaApi.getAllAppointments).mockResolvedValue([
      appointment({ client_name: 'Cita de hoy' }),
      appointment({ client_name: 'Cita futura', start_at: nextWeek, end_at: nextWeek }),
    ]);

    renderAgenda();

    expect(await screen.findByText('Cita de hoy')).toBeInTheDocument();
    expect(screen.queryByText('Cita futura')).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay citas en el día', async () => {
    vi.mocked(agendaApi.getAllAppointments).mockResolvedValue([]);

    renderAgenda();

    expect(await screen.findByText(/sin citas este día/i)).toBeInTheDocument();
  });
});
