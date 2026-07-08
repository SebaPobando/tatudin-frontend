import { describe, expect, it } from 'vitest';
import { EVENT_STATUS_LABEL, formatEventRange, localToISO } from './lib';

describe('eventos/lib', () => {
  it('etiqueta todos los estados en español', () => {
    expect(EVENT_STATUS_LABEL.draft).toBe('Borrador');
    expect(EVENT_STATUS_LABEL.in_progress).toBe('En curso');
    expect(EVENT_STATUS_LABEL.canceled).toBe('Cancelado');
  });

  it('formatEventRange colapsa el día cuando empieza y termina el mismo día', () => {
    const out = formatEventRange('2026-06-03T08:00:00Z', '2026-06-03T22:00:00Z');
    // Un solo día → una fecha y dos horas separadas por guion.
    expect(out).toMatch(/–/);
    expect(out.match(/2026/g)?.length).toBe(1);
  });

  it('formatEventRange muestra ambos extremos cuando abarca varios días', () => {
    const out = formatEventRange('2026-06-01T08:00:00Z', '2026-06-03T22:00:00Z');
    expect(out).toContain('→');
  });

  it('localToISO convierte hora local a ISO/UTC', () => {
    // Sea cual sea la zona del runner, produce un ISO válido en Z.
    expect(localToISO('2026-06-01T08:00')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
