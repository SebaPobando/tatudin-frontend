import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './errors';

function axiosError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'fail',
    'ERR',
    config,
    {},
    {
      status,
      statusText: '',
      headers: {},
      config,
      data,
    },
  );
}

describe('getApiErrorMessage', () => {
  it('extrae detail (403 de tenant)', () => {
    expect(getApiErrorMessage(axiosError(403, { detail: 'No tienes acceso a este tenant.' }))).toBe(
      'No tienes acceso a este tenant.',
    );
  });

  it('extrae el primer error de campo (400 de validación)', () => {
    expect(
      getApiErrorMessage(
        axiosError(400, { artist_id: ['Este artista ya tiene una cita en ese horario.'] }),
      ),
    ).toBe('artist_id: Este artista ya tiene una cita en ese horario.');
  });

  it('maneja errores de service layer (string plano)', () => {
    expect(getApiErrorMessage(axiosError(400, { booth_id: 'Esta cabina ya está ocupada.' }))).toBe(
      'booth_id: Esta cabina ya está ocupada.',
    );
  });

  it('incluye request_id en errores 500', () => {
    const msg = getApiErrorMessage(
      axiosError(500, { detail: 'Ha ocurrido un error inesperado.', request_id: 'a1b2c3' }),
    );
    expect(msg).toContain('a1b2c3');
  });

  it('error de red → mensaje de conexión', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() });
    expect(getApiErrorMessage(err)).toMatch(/conectar con el servidor/i);
  });
});
