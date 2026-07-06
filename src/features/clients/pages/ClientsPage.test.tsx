import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Client } from '@/types/api';
import * as clientsApi from '../api';
import { ClientsPage } from './ClientsPage';

vi.mock('../api');

function client(overrides: Partial<Client>): Client {
  return {
    id: crypto.randomUUID(),
    first_name: 'Ana',
    last_name: 'Pérez',
    full_name: 'Ana Pérez',
    email: 'ana@mail.com',
    phone: '',
    birthdate: null,
    source: 'instagram',
    tags: [],
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  };
}

function paginated(results: Client[]) {
  return { count: results.length, next: null, previous: null, results };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clientes']}>
        <ClientsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('lista clientes con su fuente', async () => {
    vi.mocked(clientsApi.getClients).mockResolvedValue(
      paginated([client({}), client({ full_name: 'Marcus R.', source: 'walk_in' })]),
    );
    renderPage();

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(within(list).getByText('Marcus R.')).toBeInTheDocument();
    expect(within(list).getByText('Instagram')).toBeInTheDocument();
    expect(within(list).getByText('Walk-in')).toBeInTheDocument();
  });

  it('la búsqueda dispara la query con ?search', async () => {
    vi.mocked(clientsApi.getClients).mockResolvedValue(paginated([]));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/buscar clientes/i), 'ana');

    await waitFor(() => {
      const calls = vi.mocked(clientsApi.getClients).mock.calls;
      expect(calls.some(([params]) => params.search === 'ana')).toBe(true);
    });
  });

  it('estado vacío sin filtros invita a crear', async () => {
    vi.mocked(clientsApi.getClients).mockResolvedValue(paginated([]));
    renderPage();

    expect(await screen.findByText(/base de clientes está vacía/i)).toBeInTheDocument();
  });
});
