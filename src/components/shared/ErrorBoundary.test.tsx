import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom({ error }: { error: unknown }): never {
  throw error;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React registra el error capturado en consola; lo silenciamos en el test.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Contenido normal</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  it('muestra el fallback y el botón de recargar ante un error de render', () => {
    render(
      <ErrorBoundary>
        <Boom error={new Error('render explotó')} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /algo salió mal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument();
  });

  it('expone el request_id cuando el error viene del backend', () => {
    const axiosError = new AxiosError('fallo', 'ERR_BAD', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      headers: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {} as any,
      data: { detail: 'Error interno del servidor.', request_id: 'req-abc-123' },
    });

    render(
      <ErrorBoundary>
        <Boom error={axiosError} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('req-abc-123')).toBeInTheDocument();
  });
});
