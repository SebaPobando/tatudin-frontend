import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { FormSubmission } from '@/types/api';
import * as formsApi from '../api';
import { SubmissionsPage } from './SubmissionsPage';

vi.mock('../api');

function submission(overrides: Partial<FormSubmission>): FormSubmission {
  return {
    id: crypto.randomUUID(),
    template_id: 'tpl1',
    template_name: 'Cotización',
    template_type: 'quote',
    client_id: null,
    client_name: null,
    status: 'pending',
    visitor_name: 'Ana Curiosa',
    visitor_email: 'ana@mail.com',
    visitor_phone: '',
    reviewer_email: null,
    reviewed_at: null,
    reviewer_notes: '',
    answers: [],
    submitted_ip: '',
    submitted_user_agent: '',
    created_at: '2026-07-06T12:00:00Z',
    updated_at: '',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/formularios/entradas']}>
        <SubmissionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SubmissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('lista entradas con visitante y estado', async () => {
    vi.mocked(formsApi.getSubmissions).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [submission({})],
    });
    renderPage();

    expect(await screen.findByText('Ana Curiosa')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getByText(/pendiente/i)).toBeInTheDocument();
  });

  it('el filtro de estado dispara la query con ?status', async () => {
    vi.mocked(formsApi.getSubmissions).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /^revisado$/i }));

    await waitFor(() => {
      const calls = vi.mocked(formsApi.getSubmissions).mock.calls;
      expect(calls.some(([params]) => params.status === 'reviewed')).toBe(true);
    });
  });
});
