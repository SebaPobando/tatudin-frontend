import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import type { TeamMember } from '@/types/api';
import * as teamApi from '../api';
import { TeamPage } from './TeamPage';

vi.mock('../api');

function member(overrides: Partial<TeamMember>): TeamMember {
  return {
    id: crypto.randomUUID(),
    user_id: 'u2',
    user_email: 'artista@mail.com',
    user_full_name: null,
    role: 'artist',
    is_active: true,
    valid_from: null,
    valid_until: null,
    invited_by_email: null,
    created_at: '',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/equipo']}>
        <TeamPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TeamPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      status: 'authenticated',
      accessToken: 'a',
      user: {
        id: 'me',
        email: 'owner@tatudin.com',
        username: 'owner',
        first_name: '',
        last_name: '',
        phone: '',
      },
    });
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('mi propia membership no ofrece revocar (espejo del no-auto-revocar)', async () => {
    vi.mocked(teamApi.getTeam).mockResolvedValue([
      member({ user_id: 'me', user_email: 'owner@tatudin.com', role: 'owner' }),
      member({}),
    ]);
    renderPage();

    expect(await screen.findByText('(tú)')).toBeInTheDocument();
    // solo un botón de revocar (el del otro miembro)
    expect(screen.getAllByRole('button', { name: /revocar acceso/i })).toHaveLength(1);
  });

  it('invita con rol y vigencia en ISO', async () => {
    vi.mocked(teamApi.getTeam).mockResolvedValue([]);
    vi.mocked(teamApi.inviteMember).mockResolvedValue(member({}));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /invitar/i }));
    await user.type(screen.getByLabelText(/email del usuario/i), 'guest@mail.com');
    await user.selectOptions(screen.getByLabelText(/rol/i), 'guest');
    await user.click(screen.getByRole('button', { name: /^invitar$/i }));

    await waitFor(() => expect(teamApi.inviteMember).toHaveBeenCalledOnce());
    const payload = vi.mocked(teamApi.inviteMember).mock.calls[0][0];
    expect(payload).toMatchObject({ email: 'guest@mail.com', role: 'guest' });
    expect(payload.valid_from).toBeUndefined();
  });

  it('revocar exige confirmación en dos pasos', async () => {
    const m = member({});
    vi.mocked(teamApi.getTeam).mockResolvedValue([m]);
    vi.mocked(teamApi.revokeMember).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /revocar acceso/i }));
    expect(teamApi.revokeMember).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /sí, revocar/i }));
    await waitFor(() => expect(teamApi.revokeMember).toHaveBeenCalledWith(m.id));
  });
});
