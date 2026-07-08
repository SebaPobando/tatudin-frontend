import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Event, Role } from '@/types/api';
import * as eventsApi from '../api';
import { EventsPage } from './EventsPage';

vi.mock('../api');

function event(overrides: Partial<Event>): Event {
  return {
    id: crypto.randomUUID(),
    name: 'Convención 2026',
    description: '',
    location: 'Bogotá',
    start_at: '2026-06-01T08:00:00Z',
    end_at: '2026-06-03T22:00:00Z',
    status: 'published',
    created_at: '2026-07-06T12:00:00Z',
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
      <MemoryRouter initialEntries={['/eventos']}>
        <EventsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista eventos con estado y lugar', async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue([event({})]);
    renderPage();

    expect(await screen.findByText('Convención 2026')).toBeInTheDocument();
    expect(screen.getByText(/publicado/i)).toBeInTheDocument();
    expect(screen.getByText(/Bogotá/)).toBeInTheDocument();
  });

  it('owner ve el botón Nuevo; un artista no', async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue([]);
    const { unmount } = renderPage('owner');
    expect(await screen.findByRole('button', { name: /nuevo/i })).toBeInTheDocument();
    unmount();

    renderPage('artist');
    await screen.findByText(/no hay eventos/i);
    expect(screen.queryByRole('button', { name: /nuevo/i })).not.toBeInTheDocument();
  });

  it('crea un evento con start/end convertidos a ISO', async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue([]);
    vi.mocked(eventsApi.createEvent).mockResolvedValue(event({}));
    const user = userEvent.setup();
    renderPage('owner');

    await user.click(await screen.findByRole('button', { name: /nuevo/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Guest spot');
    // inputs datetime-local: userEvent.type no funciona → fireEvent.change
    fireEvent.change(screen.getByLabelText(/empieza/i), { target: { value: '2026-06-01T08:00' } });
    fireEvent.change(screen.getByLabelText(/termina/i), { target: { value: '2026-06-01T18:00' } });
    await user.click(screen.getByRole('button', { name: /crear evento/i }));

    await waitFor(() => {
      expect(eventsApi.createEvent).toHaveBeenCalledTimes(1);
    });
    const payload = vi.mocked(eventsApi.createEvent).mock.calls[0][0];
    expect(payload.name).toBe('Guest spot');
    expect(payload.start_at).toMatch(/Z$/);
    expect(payload.end_at).toMatch(/Z$/);
  });
});
