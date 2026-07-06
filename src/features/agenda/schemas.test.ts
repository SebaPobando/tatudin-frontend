import { describe, expect, it } from 'vitest';
import { appointmentSchema } from './schemas';

const valid = {
  artist_id: '',
  client_id: '',
  reason_id: '',
  service_id: '',
  project_id: '',
  client_name: 'Ana Pérez',
  client_phone: '',
  date: '2026-07-10',
  start_time: '14:00',
  end_time: '16:00',
  booth_id: '',
  estimated_price: '350000.00',
  notes: '',
};

describe('appointmentSchema', () => {
  it('acepta una cita válida', () => {
    expect(appointmentSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza fin antes del inicio (espejo del constraint del backend)', () => {
    const result = appointmentSchema.safeParse({ ...valid, end_time: '13:00' });
    expect(result.success).toBe(false);
  });

  it('rechaza precio con formato inválido', () => {
    expect(appointmentSchema.safeParse({ ...valid, estimated_price: '35,000' }).success).toBe(
      false,
    );
    expect(appointmentSchema.safeParse({ ...valid, estimated_price: 'gratis' }).success).toBe(
      false,
    );
  });

  it('precio vacío es válido (campo opcional)', () => {
    expect(appointmentSchema.safeParse({ ...valid, estimated_price: '' }).success).toBe(true);
  });
});
