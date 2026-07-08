import { describe, expect, it } from 'vitest';
import { PERIOD_LABEL, formatRate } from './lib';

describe('analytics/lib', () => {
  describe('formatRate', () => {
    it('trata fracciones 0..1 como porcentaje', () => {
      expect(formatRate(0.83)).toBe('83%');
      expect(formatRate(0.75)).toBe('75%');
      expect(formatRate(0)).toBe('0%');
    });
    it('trata >1 como porcentaje ya escalado (robustez)', () => {
      expect(formatRate(83)).toBe('83%');
    });
    it('maneja nulos', () => {
      expect(formatRate(undefined)).toBe('—');
      expect(formatRate(null)).toBe('—');
    });
  });

  it('etiqueta los períodos', () => {
    expect(PERIOD_LABEL.week).toBe('Semana');
    expect(PERIOD_LABEL.year).toBe('Año');
  });
});
