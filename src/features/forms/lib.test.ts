import { describe, expect, it } from 'vitest';
import { toSlug } from './lib';

describe('toSlug', () => {
  it('genera slugs URL-safe con guiones', () => {
    expect(toSlug('Cotización de tatuaje')).toBe('cotizacion-de-tatuaje');
    expect(toSlug('Consentimiento Piercing 2026')).toBe('consentimiento-piercing-2026');
    expect(toSlug('  ¡¿Diseño?!  ')).toBe('diseno');
  });
});
