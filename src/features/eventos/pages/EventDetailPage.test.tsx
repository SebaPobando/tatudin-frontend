import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Event, EventArtist, Role } from '@/types/api';
import * as eventsApi from '../api';
import { EventDetailPage } from './EventDetailPage';

vi.mock('../api');
vi.mock('@/features/team/api');

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 'ev1',
    name: 'Convención 2026',
    description: 'La grande del año',
    location: 'Bogotá',
    start_at: '2026-06-01T08:00:00Z',
    end_at: '2026-06-03T22:00:00Z',
    status: 'published',
    created_at: '2026-07-06T12:00:00Z',
    updated_at: '',
    ...overrides,
  };
}

function artist(overrides: Partial<EventArtist> = {}): EventArtist {
  return {
    id: 'ea1',
    user_id: 'u1',
    user_email: 'artista@mail.com',
    user_full_name: 'Vale Artista',
    commission_percentage: '80.00',
    notes: '',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function renderPage(role: Role = 'owner') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useTenantStore.setState({
    activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/eventos/ev1']}>
        <Routes>
          <Route path="/eventos/:id" element={<EventDetailPage />} />
          <Route path="/eventos" element={<div>Lista de eventos</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el evento y sus artistas asignados', async () => {
    vi.mocked(eventsApi.getEvent).mockResolvedValue(event());
    vi.mocked(eventsApi.getEventArtists).mockResolvedValue([artist()]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Convención 2026' })).toBeInTheDocument();
    expect(screen.getByText('Vale Artista')).toBeInTheDocument();
    expect(screen.getByText(/Comisión 80.00%/)).toBeInTheDocument();
    expect(screen.getByText(/Bogotá/)).toBeInTheDocument();
  });

  it('staff quita un artista en dos pasos', async () => {
    vi.mocked(eventsApi.getEvent).mockResolvedValue(event());
    vi.mocked(eventsApi.getEventArtists).mockResolvedValue([artist()]);
    vi.mocked(eventsApi.removeArtist).mockResolvedValue();
    const user = userEvent.setup();
    renderPage('owner');

    await user.click(await screen.findByRole('button', { name: /quitar vale artista/i }));
    await user.click(screen.getByRole('button', { name: /^quitar$/i }));

    await waitFor(() => {
      expect(eventsApi.removeArtist).toHaveBeenCalledWith('ev1', 'ea1');
    });
  });

  it('un artista no ve el botón de eliminar evento', async () => {
    vi.mocked(eventsApi.getEvent).mockResolvedValue(event());
    vi.mocked(eventsApi.getEventArtists).mockResolvedValue([]);
    renderPage('artist');

    await screen.findByRole('heading', { name: 'Convención 2026' });
    expect(screen.queryByRole('button', { name: /eliminar evento/i })).not.toBeInTheDocument();
  });
});
