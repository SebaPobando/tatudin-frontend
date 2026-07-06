import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as agendaApi from '@/features/agenda/api';
import * as teamApi from '@/features/team/api';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import * as finanzasApi from '../api';
import { NewPaymentPage } from './NewPaymentPage';

vi.mock('../api');
vi.mock('@/features/agenda/api');
vi.mock('@/features/team/api');

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/finanzas/pagos/nuevo']}>
        <NewPaymentPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NewPaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(agendaApi.getAllAppointments).mockResolvedValue([]);
    vi.mocked(teamApi.getTeam).mockResolvedValue([]);
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

  it('registra un pago con el split default de 100% al estudio', async () => {
    vi.mocked(finanzasApi.createPayment).mockResolvedValue({ id: 'p1' } as never);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/quién paga/i), 'Ana Pérez');
    await user.type(screen.getByLabelText(/monto/i), '350000.00');
    await user.click(screen.getByRole('button', { name: /registrar pago/i }));

    await waitFor(() => expect(finanzasApi.createPayment).toHaveBeenCalledOnce());
    const payload = vi.mocked(finanzasApi.createPayment).mock.calls[0][0];
    expect(payload.splits).toEqual([{ recipient_id: null, percentage: '100.00' }]);
    expect(payload.amount).toBe('350000.00');
  });

  it('muestra la suma en vivo y bloquea si no da 100', async () => {
    const user = userEvent.setup();
    renderPage();

    // cambia el split default de 100 a 60 → suma 60.00
    const percentInput = screen.getByLabelText(/porcentaje del split 1/i);
    await user.clear(percentInput);
    await user.type(percentInput, '60.00');

    expect(await screen.findByText('60.00 / 100.00')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/quién paga/i), 'Ana');
    await user.type(screen.getByLabelText(/monto/i), '100');
    await user.click(screen.getByRole('button', { name: /registrar pago/i }));

    expect(await screen.findByText(/deben sumar exactamente 100/i)).toBeInTheDocument();
    expect(finanzasApi.createPayment).not.toHaveBeenCalled();
  });
});
