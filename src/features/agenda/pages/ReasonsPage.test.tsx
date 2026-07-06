import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { AppointmentReason } from '@/types/api';
import * as agendaApi from '../api';
import { toCode } from '../lib';
import { ReasonsPage } from './ReasonsPage';

vi.mock('../api');

function reason(overrides: Partial<AppointmentReason>): AppointmentReason {
  return {
    id: crypto.randomUUID(),
    name: 'Tatuaje nuevo',
    code: 'new_tattoo',
    color: '#2563eb',
    is_active: true,
    sort_order: 10,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/agenda/motivos']}>
        <ReasonsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('toCode', () => {
  it('genera codes únicos estilo backend desde el nombre', () => {
    expect(toCode('Sesión de proyecto')).toBe('sesion_de_proyecto');
    expect(toCode('Cover up')).toBe('cover_up');
    expect(toCode('  Diseño!!  ')).toBe('diseno');
  });
});

describe('ReasonsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('lista los motivos ordenados por sort_order', async () => {
    vi.mocked(agendaApi.getReasons).mockResolvedValue([
      reason({ name: 'Retoque', sort_order: 20 }),
      reason({ name: 'Tatuaje nuevo', sort_order: 10 }),
    ]);
    renderPage();

    const items = await screen.findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Tatuaje nuevo');
    expect(items[1]).toHaveTextContent('Retoque');
  });

  it('crea un motivo generando el code automáticamente', async () => {
    vi.mocked(agendaApi.getReasons).mockResolvedValue([]);
    vi.mocked(agendaApi.createReason).mockResolvedValue(reason({}));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /nuevo/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Sesión de proyecto');
    await user.click(screen.getByRole('button', { name: /crear motivo/i }));

    await waitFor(() => expect(agendaApi.createReason).toHaveBeenCalledOnce());
    expect(vi.mocked(agendaApi.createReason).mock.calls[0][0]).toMatchObject({
      name: 'Sesión de proyecto',
      code: 'sesion_de_proyecto',
    });
  });
});
