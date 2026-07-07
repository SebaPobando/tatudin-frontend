import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicFormTemplate } from '@/types/api';
import * as publicApi from '../api';
import { PublicFormPage } from './PublicFormPage';

vi.mock('../api');

const template: PublicFormTemplate = {
  id: 'tpl1',
  name: 'Cotización',
  type: 'quote',
  description: '',
  instructions: 'Cuéntanos tu idea',
  submit_message: '¡Gracias! Te escribimos pronto.',
  fields: [
    {
      id: 'f-nombre',
      field_type: 'text',
      label: 'Tu nombre',
      help_text: '',
      placeholder: '',
      required: true,
      order: 10,
      options: [],
      min_length: null,
      max_length: null,
    },
    {
      id: 'f-zona',
      field_type: 'select',
      label: 'Zona del cuerpo',
      help_text: '',
      placeholder: '',
      required: false,
      order: 20,
      options: ['Brazo', 'Pierna'],
      min_length: null,
      max_length: null,
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/f/estudio-seba/cotizacion']}>
        <Routes>
          <Route path="/f/:tenantSlug/:formSlug" element={<PublicFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PublicFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getPublicForm).mockResolvedValue(template);
  });

  it('renderiza el form dinámico con sus campos e instrucciones', async () => {
    renderPage();

    expect(await screen.findByText('Cotización')).toBeInTheDocument();
    expect(screen.getByText('Cuéntanos tu idea')).toBeInTheDocument();
    expect(screen.getByLabelText(/tu nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zona del cuerpo/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Brazo' })).toBeInTheDocument();
  });

  it('bloquea el envío si falta un requerido', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/este campo es requerido/i)).toBeInTheDocument();
    expect(publicApi.submitPublicForm).not.toHaveBeenCalled();
  });

  it('envía el payload y muestra el submit_message', async () => {
    vi.mocked(publicApi.submitPublicForm).mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/tu nombre/i), 'Ana Curiosa');
    await user.selectOptions(screen.getByLabelText(/zona del cuerpo/i), 'Brazo');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => expect(publicApi.submitPublicForm).toHaveBeenCalledOnce());
    const [tenantSlug, formSlug, payload] = vi.mocked(publicApi.submitPublicForm).mock.calls[0];
    expect(tenantSlug).toBe('estudio-seba');
    expect(formSlug).toBe('cotizacion');
    expect(payload.answers).toEqual([
      { field_id: 'f-nombre', value: 'Ana Curiosa' },
      { field_id: 'f-zona', value: 'Brazo' },
    ]);
    expect(payload.visitor_name).toBe('Ana Curiosa');

    expect(await screen.findByText(/te escribimos pronto/i)).toBeInTheDocument();
  });
});
