import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Booth } from '@/types/api';
import * as agendaApi from '../api';
import { BoothsPage } from './BoothsPage';

vi.mock('../api');

const booths: Booth[] = [
  { id: 'b1', name: 'Cabina 1', description: 'Principal', is_active: true },
  { id: 'b2', name: 'Cabina 2', description: '', is_active: false },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/agenda/cabinas']}>
        <BoothsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BoothsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('lista las cabinas con su estado', async () => {
    vi.mocked(agendaApi.getBooths).mockResolvedValue(booths);
    renderPage();

    expect(await screen.findByText('Cabina 1')).toBeInTheDocument();
    expect(screen.getByText('Cabina 2')).toBeInTheDocument();
    // la inactiva ofrece "Activar", la activa ofrece "Desactivar"
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  });

  it('crea una cabina desde el form inline', async () => {
    vi.mocked(agendaApi.getBooths).mockResolvedValue([]);
    vi.mocked(agendaApi.createBooth).mockResolvedValue(booths[0]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /nueva/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Cabina 1');
    await user.click(screen.getByRole('button', { name: /crear cabina/i }));

    await waitFor(() => expect(agendaApi.createBooth).toHaveBeenCalledOnce());
    expect(vi.mocked(agendaApi.createBooth).mock.calls[0][0]).toMatchObject({ name: 'Cabina 1' });
  });

  it('borrar exige confirmación en dos pasos', async () => {
    vi.mocked(agendaApi.getBooths).mockResolvedValue([booths[0]]);
    vi.mocked(agendaApi.deleteBooth).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /eliminar cabina 1/i }));
    expect(agendaApi.deleteBooth).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /sí, borrar/i }));
    await waitFor(() => expect(agendaApi.deleteBooth).toHaveBeenCalledWith('b1'));
  });
});
