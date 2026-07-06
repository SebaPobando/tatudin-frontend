import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientsApi from '@/features/clients/api';
import { useTenantStore } from '@/stores/tenant';
import type { AppointmentParticipant, Client } from '@/types/api';
import * as agendaApi from '../api';
import { ParticipantsCard } from './ParticipantsCard';

vi.mock('../api');
vi.mock('@/features/clients/api');

const participant: AppointmentParticipant = {
  id: 'pt1',
  client_id: 'c1',
  client_name: 'Cliente Prueba',
  client_phone: '',
  individual_price: '150000.00',
  notes: 'Flash #3',
  created_at: '',
  updated_at: '',
};

const client: Client = {
  id: 'c2',
  first_name: 'Marcus',
  last_name: 'R.',
  full_name: 'Marcus R.',
  email: '',
  phone: '',
  birthdate: null,
  source: 'walk_in',
  tags: [],
  notes: '',
  created_at: '',
  updated_at: '',
};

function renderCard(canAdd = true) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ParticipantsCard appointmentId="apt1" canAdd={canAdd} />
    </QueryClientProvider>,
  );
}

describe('ParticipantsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [client],
    });
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('lista participantes con su precio individual', async () => {
    vi.mocked(agendaApi.getParticipants).mockResolvedValue([participant]);
    renderCard();

    expect(await screen.findByText('Cliente Prueba')).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
  });

  it('agrega participante con client + precio', async () => {
    vi.mocked(agendaApi.getParticipants).mockResolvedValue([]);
    vi.mocked(agendaApi.addParticipant).mockResolvedValue(participant);
    const user = userEvent.setup();
    renderCard();

    await user.click(await screen.findByRole('button', { name: /agregar/i }));
    await user.selectOptions(await screen.findByLabelText(/cliente/i), 'c2');
    await user.type(screen.getByLabelText(/precio individual/i), '150000');
    await user.click(screen.getByRole('button', { name: /agregar participante/i }));

    await waitFor(() =>
      expect(agendaApi.addParticipant).toHaveBeenCalledWith('apt1', {
        client: 'c2',
        individual_price: '150000',
        notes: undefined,
      }),
    );
  });

  it('sin permiso de agregar (cita completada) no muestra el botón', async () => {
    vi.mocked(agendaApi.getParticipants).mockResolvedValue([participant]);
    renderCard(false);

    expect(await screen.findByText('Cliente Prueba')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /agregar/i })).not.toBeInTheDocument();
  });
});
