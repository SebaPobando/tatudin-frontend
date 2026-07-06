import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import type { Membership } from '@/types/api';
import * as authApi from '../api';
import { SelectTenantPage } from './SelectTenantPage';

vi.mock('../api');

function membership(id: string, name: string, role: Membership['role'] = 'owner'): Membership {
  return {
    role,
    is_active: true,
    tenant: {
      id,
      name,
      slug: name.toLowerCase().replace(/\s/g, '-'),
      type: 'studio',
      subscription_plan: 'free',
      timezone: 'America/Bogota',
      is_active: true,
    },
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/select-tenant']}>
        <Routes>
          <Route path="/select-tenant" element={<SelectTenantPage />} />
          <Route path="/" element={<p>dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SelectTenantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ status: 'authenticated', accessToken: 'a', user: null });
    useTenantStore.setState({ activeTenant: null });
  });

  it('lista los tenants y selecciona al hacer click', async () => {
    vi.mocked(authApi.getMemberships).mockResolvedValue([
      membership('t1', 'Estudio Scar'),
      membership('t2', 'Ink House', 'guest'),
    ]);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Estudio Scar')).toBeInTheDocument();
    expect(screen.getByText('Ink House')).toBeInTheDocument();

    await user.click(screen.getByText('Ink House'));

    expect(useTenantStore.getState().activeTenant).toMatchObject({ id: 't2', role: 'guest' });
    expect(await screen.findByText('dashboard')).toBeInTheDocument();
  });

  it('con un solo tenant, autoselecciona y navega', async () => {
    vi.mocked(authApi.getMemberships).mockResolvedValue([membership('t1', 'Estudio Scar')]);
    renderPage();

    await waitFor(() => {
      expect(useTenantStore.getState().activeTenant?.id).toBe('t1');
    });
    expect(await screen.findByText('dashboard')).toBeInTheDocument();
  });

  it('sin membresías muestra el estado vacío', async () => {
    vi.mocked(authApi.getMemberships).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/no tienes membresías activas/i)).toBeInTheDocument();
  });
});
