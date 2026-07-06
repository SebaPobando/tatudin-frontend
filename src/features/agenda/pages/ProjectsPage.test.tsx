import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { Project } from '@/types/api';
import * as agendaApi from '../api';
import { projectProgress } from '../lib';
import { ProjectsPage } from './ProjectsPage';

vi.mock('../api');

function project(overrides: Partial<Project>): Project {
  return {
    id: crypto.randomUUID(),
    title: 'Manga japonesa',
    description: '',
    status: 'in_progress',
    estimated_sessions: 3,
    estimated_total_price: '1200000.00',
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
    ...overrides,
  };
}

describe('projectProgress (cálculo client-side, ints sin ambigüedad)', () => {
  it('1 de 3 sesiones → 33%', () => {
    expect(projectProgress(1, 3)).toBe(33);
  });

  it('sin estimación → 0 (sin dividir por null)', () => {
    expect(projectProgress(2, null)).toBe(0);
  });

  it('más completadas que estimadas → tope en 100', () => {
    expect(projectProgress(5, 3)).toBe(100);
  });
});

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('lista proyectos con progreso y estado', async () => {
    vi.mocked(agendaApi.getProjects).mockResolvedValue([project({})]);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Manga japonesa')).toBeInTheDocument();
    expect(screen.getByText('1/3 sesiones')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });
});
