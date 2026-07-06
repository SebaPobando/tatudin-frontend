import { describe, expect, it } from 'vitest';
import { PRIMARY_NAV, SECONDARY_NAV, visibleItems } from './nav';

describe('visibleItems (matriz de roles)', () => {
  it('owner ve toda la navegación secundaria', () => {
    const labels = visibleItems(SECONDARY_NAV, 'owner').map((i) => i.label);
    expect(labels).toContain('Integraciones');
    expect(labels).toContain('Equipo');
    expect(labels).toContain('Analytics');
  });

  it('receptionist NO ve Integraciones, Equipo ni Analytics', () => {
    const labels = visibleItems(SECONDARY_NAV, 'receptionist').map((i) => i.label);
    expect(labels).not.toContain('Integraciones');
    expect(labels).not.toContain('Equipo');
    expect(labels).not.toContain('Analytics');
    expect(labels).toContain('Clientes');
  });

  it('artist opera su agenda y clientes pero no administra', () => {
    const labels = visibleItems(SECONDARY_NAV, 'artist').map((i) => i.label);
    expect(labels).toContain('Clientes');
    expect(labels).not.toContain('Formularios');
    expect(labels).not.toContain('Ajustes');
  });

  it('todos los roles ven la navegación principal', () => {
    for (const role of ['owner', 'admin', 'artist', 'receptionist', 'guest'] as const) {
      expect(visibleItems(PRIMARY_NAV, role).map((i) => i.label)).toContain('Agenda');
    }
  });

  it('sin rol (tenant no seleccionado) no hay items', () => {
    expect(visibleItems(PRIMARY_NAV, undefined)).toEqual([]);
  });

  it('Inventario existe pero marcado como soon (no está en el backend)', () => {
    const inventario = visibleItems(PRIMARY_NAV, 'owner').find((i) => i.label === 'Inventario');
    expect(inventario?.soon).toBe(true);
  });
});
