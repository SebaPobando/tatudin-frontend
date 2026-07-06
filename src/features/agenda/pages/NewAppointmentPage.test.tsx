import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import * as catalogApi from '@/features/catalog/api';
import * as clientsApi from '@/features/clients/api';
import * as teamApi from '@/features/team/api';
import * as agendaApi from '../api';
import { NewAppointmentPage } from './NewAppointmentPage';

vi.mock('../api');
vi.mock('@/features/team/api');
vi.mock('@/features/clients/api');
vi.mock('@/features/catalog/api');

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/agenda/nueva']}>
        <NewAppointmentPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/cliente/i), 'Ana Pérez');
  // inputs nativos date/time no aceptan typing simulado — se setean por change
  fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: '2026-07-10' } });
  fireEvent.change(screen.getByLabelText(/inicio/i), { target: { value: '14:00' } });
  fireEvent.change(screen.getByLabelText(/fin/i), { target: { value: '16:00' } });
}

describe('NewAppointmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(agendaApi.getBooths).mockResolvedValue([]);
    vi.mocked(teamApi.getTeam).mockResolvedValue([]);
    vi.mocked(agendaApi.getReasons).mockResolvedValue([]);
    vi.mocked(catalogApi.getServices).mockResolvedValue([]);
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    useAuthStore.setState({
      status: 'authenticated',
      accessToken: 'a',
      user: {
        id: 'user-uuid',
        email: 'scar@tatudin.com',
        username: 'scar',
        first_name: 'Scar',
        last_name: '',
        phone: '',
      },
    });
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('crea la cita con payload ISO y artist_id del user actual', async () => {
    vi.mocked(agendaApi.createAppointment).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /crear cita/i }));

    await waitFor(() => expect(agendaApi.createAppointment).toHaveBeenCalledOnce());
    const payload = vi.mocked(agendaApi.createAppointment).mock.calls[0][0];
    expect(payload.artist_id).toBe('user-uuid');
    expect(payload.start_at).toBe(new Date('2026-07-10T14:00').toISOString());
    expect(payload.booth_id).toBeNull();
  });

  it('muestra el error de solapamiento del backend junto al horario', async () => {
    const config = { headers: new AxiosHeaders() };
    vi.mocked(agendaApi.createAppointment).mockRejectedValue(
      new AxiosError(
        'bad request',
        'ERR',
        config,
        {},
        {
          status: 400,
          statusText: '',
          headers: {},
          config,
          data: { artist_id: 'Este artista ya tiene una cita en ese horario.' },
        },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /crear cita/i }));

    expect(await screen.findByText(/ya tiene una cita en ese horario/i)).toBeInTheDocument();
  });

  it('staff puede agendar para otro artista del equipo', async () => {
    vi.mocked(teamApi.getTeam).mockResolvedValue([
      {
        id: 'ut1',
        user_id: 'artist-2',
        user_email: 'otro@tatudin.com',
        user_full_name: 'Otro Artista',
        role: 'artist',
        is_active: true,
        valid_from: null,
        valid_until: null,
        invited_by_email: null,
        created_at: '',
      },
    ]);
    vi.mocked(agendaApi.createAppointment).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.selectOptions(await screen.findByLabelText(/artista/i), 'artist-2');
    await user.click(screen.getByRole('button', { name: /crear cita/i }));

    await waitFor(() => expect(agendaApi.createAppointment).toHaveBeenCalledOnce());
    expect(vi.mocked(agendaApi.createAppointment).mock.calls[0][0].artist_id).toBe('artist-2');
  });
});
