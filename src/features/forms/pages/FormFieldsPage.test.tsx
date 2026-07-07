import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTenantStore } from '@/stores/tenant';
import type { FormTemplate } from '@/types/api';
import * as formsApi from '../api';
import { FormFieldsPage } from './FormFieldsPage';

vi.mock('../api');

const template: FormTemplate = {
  id: 'tpl1',
  name: 'Cotización',
  slug: 'cotizacion',
  type: 'quote',
  description: '',
  instructions: '',
  is_active: true,
  submit_message: '',
  fields: [
    {
      id: 'f1',
      field_type: 'text',
      label: 'Tu nombre',
      help_text: '',
      placeholder: '',
      required: true,
      order: 10,
      options: null,
      min_length: null,
      max_length: null,
      created_at: '',
      updated_at: '',
    },
  ],
  fields_count: 1,
  submissions_count: 0,
  created_at: '',
  updated_at: '',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/formularios/tpl1/campos']}>
        <Routes>
          <Route path="/formularios/:id/campos" element={<FormFieldsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FormFieldsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(formsApi.getTemplate).mockResolvedValue(template);
    useTenantStore.setState({
      activeTenant: { id: 't1', name: 'Estudio', slug: 'estudio', role: 'owner' },
    });
  });

  it('agrega un campo select con options como array', async () => {
    vi.mocked(formsApi.createField).mockResolvedValue(template.fields[0]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /^campo$/i }));
    await user.selectOptions(screen.getByLabelText(/tipo de campo/i), 'select');
    await user.type(screen.getByLabelText(/etiqueta/i), 'Zona del cuerpo');
    await user.type(screen.getByLabelText(/opciones/i), 'Brazo, Pierna, Espalda');
    await user.click(screen.getByRole('button', { name: /agregar campo/i }));

    await waitFor(() => expect(formsApi.createField).toHaveBeenCalledOnce());
    const [templateId, payload] = vi.mocked(formsApi.createField).mock.calls[0];
    expect(templateId).toBe('tpl1');
    expect(payload).toMatchObject({
      field_type: 'select',
      label: 'Zona del cuerpo',
      options: ['Brazo', 'Pierna', 'Espalda'],
      order: 20, // max(10) + 10
    });
  });

  it('select con menos de 2 opciones no envía', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /^campo$/i }));
    await user.selectOptions(screen.getByLabelText(/tipo de campo/i), 'multiselect');
    await user.type(screen.getByLabelText(/etiqueta/i), 'Estilos');
    await user.type(screen.getByLabelText(/opciones/i), 'Blackwork');
    await user.click(screen.getByRole('button', { name: /agregar campo/i }));

    expect(await screen.findByText(/al menos 2 opciones/i)).toBeInTheDocument();
    expect(formsApi.createField).not.toHaveBeenCalled();
  });

  it('campo de texto NO envía options', async () => {
    vi.mocked(formsApi.createField).mockResolvedValue(template.fields[0]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /^campo$/i }));
    await user.type(screen.getByLabelText(/etiqueta/i), 'Tu idea');
    await user.click(screen.getByRole('button', { name: /agregar campo/i }));

    await waitFor(() => expect(formsApi.createField).toHaveBeenCalledOnce());
    expect(vi.mocked(formsApi.createField).mock.calls[0][1].options).toBeUndefined();
  });
});
