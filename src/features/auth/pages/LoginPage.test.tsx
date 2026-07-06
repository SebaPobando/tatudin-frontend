import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import type { LoginResponse } from '@/types/api';
import * as authApi from '../api';
import { LoginPage } from './LoginPage';

vi.mock('../api');

const loginResponse: LoginResponse = {
  access: 'access-token',
  refresh: 'refresh-token',
  user: {
    id: 'u1',
    email: 'scar@tatudin.com',
    username: 'scar',
    first_name: 'Scar',
    last_name: '',
    phone: '',
  },
};

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.setState({ status: 'unauthenticated', accessToken: null, user: null });
  });

  it('valida antes de enviar: no llama al API con campos vacíos', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByText(/email válido/i)).toBeInTheDocument();
    expect(screen.getByText(/contraseña es requerida/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('login exitoso guarda la sesión', async () => {
    vi.mocked(authApi.login).mockResolvedValue(loginResponse);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'scar@tatudin.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe('authenticated');
    });
    expect(useAuthStore.getState().accessToken).toBe('access-token');
    expect(sessionStorage.getItem('tatudin.refresh')).toBe('refresh-token');
  });

  it('muestra el error del backend (ej. throttle 429)', async () => {
    const { AxiosError, AxiosHeaders } = await import('axios');
    const config = { headers: new AxiosHeaders() };
    vi.mocked(authApi.login).mockRejectedValue(
      new AxiosError(
        'throttled',
        'ERR',
        config,
        {},
        {
          status: 429,
          statusText: '',
          headers: {},
          config,
          data: { detail: 'Request was throttled. Expected available in 47 seconds.' },
        },
      ),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'scar@tatudin.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreta');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/throttled/i);
  });
});
