import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Project } from '@/types/api';
import * as agendaApi from '../api';
import { ProjectDetailPage } from './ProjectDetailPage';

vi.mock('../api');

const baseProject: Project = {
  id: 'p1',
  title: 'Manga japonesa',
  description: '',
  status: 'in_progress',
  estimated_sessions: 3,
  estimated_total_price: null,
  reference_notes: '',
  started_at: null,
  completed_at: null,
  client_id: 'c1',
  client_name: 'Ana Pérez',
  lead_artist_id: 'a1',
  lead_artist_email: 'scar@tatudin.com',
  sessions_count: 2,
  completed_sessions: 1,
  remaining_sessions: 2,
  progress_percentage: 0,
  next_session_at: null,
  last_session_at: null,
  created_at: '',
  updated_at: '',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/proyectos/p1']}>
        <Routes>
          <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(agendaApi.getProject).mockResolvedValue(baseProject);
    vi.mocked(agendaApi.getProjectSessions).mockResolvedValue([]);
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('Completar proyecto llama al endpoint dedicado', async () => {
    vi.mocked(agendaApi.completeProject).mockResolvedValue({
      ...baseProject,
      status: 'completed',
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /completar proyecto/i }));

    await waitFor(() => expect(agendaApi.completeProject).toHaveBeenCalledWith('p1'));
  });

  it('muestra el 400 del backend cuando hay sesiones pendientes', async () => {
    const config = { headers: new AxiosHeaders() };
    vi.mocked(agendaApi.completeProject).mockRejectedValue(
      new AxiosError(
        'bad',
        'ERR',
        config,
        {},
        {
          status: 400,
          statusText: '',
          headers: {},
          config,
          data: { detail: 'El proyecto tiene 2 sesiones sin completar.' },
        },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /completar proyecto/i }));

    expect(await screen.findByText(/2 sesiones sin completar/i)).toBeInTheDocument();
  });

  it('proyecto completado no ofrece acciones', async () => {
    vi.mocked(agendaApi.getProject).mockResolvedValue({ ...baseProject, status: 'completed' });
    renderPage();

    expect(await screen.findByText(/completado/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /completar proyecto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pausar/i })).not.toBeInTheDocument();
  });
});
