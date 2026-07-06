import { describe, expect, it } from 'vitest';
import { durationToMinutes, minutesToDuration, serviceSchema, valuesToServicePayload } from './lib';

const valid = {
  name: 'Flash',
  description: '',
  duration_minutes: '90',
  base_price: '350000.00',
  requires_deposit: false,
  default_deposit_amount: '',
  color: '#2563eb',
  default_artist: '',
};

describe('conversión de duración (DurationField de Django)', () => {
  it('minutos → "HH:MM:SS"', () => {
    expect(minutesToDuration(90)).toBe('01:30:00');
    expect(minutesToDuration(60)).toBe('01:00:00');
    expect(minutesToDuration(45)).toBe('00:45:00');
  });

  it('"HH:MM:SS" → minutos (y soporta formato con días)', () => {
    expect(durationToMinutes('01:30:00')).toBe(90);
    expect(durationToMinutes('1 02:00:00')).toBe(1560);
  });

  it('roundtrip estable', () => {
    expect(durationToMinutes(minutesToDuration(150))).toBe(150);
  });
});

describe('serviceSchema', () => {
  it('acepta un servicio válido', () => {
    expect(serviceSchema.safeParse(valid).success).toBe(true);
  });

  it('espejo del CheckConstraint: depósito requerido exige monto', () => {
    const result = serviceSchema.safeParse({ ...valid, requires_deposit: true });
    expect(result.success).toBe(false);
  });

  it('con depósito y monto, el payload manda el monto; sin depósito manda null', () => {
    const withDeposit = valuesToServicePayload({
      ...valid,
      requires_deposit: true,
      default_deposit_amount: '100000',
    });
    expect(withDeposit.default_deposit_amount).toBe('100000');
    expect(valuesToServicePayload(valid).default_deposit_amount).toBeNull();
  });

  it('payload convierte duración a formato Django', () => {
    expect(valuesToServicePayload(valid).default_duration).toBe('01:30:00');
  });
});
