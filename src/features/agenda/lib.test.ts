import { describe, expect, it } from 'vitest';
import { valuesToPayload } from './lib';

const values = {
  artist_id: '',
  client_id: '',
  reason_id: '',
  service_id: '',
  project_id: '',
  client_name: 'Ana',
  client_phone: '',
  date: '2026-07-10',
  start_time: '14:00',
  end_time: '16:00',
  booth_id: '',
  estimated_price: '',
  notes: '',
};

describe('valuesToPayload', () => {
  it('convierte fecha+hora local a ISO 8601 (el backend guarda tstzrange)', () => {
    const payload = valuesToPayload(values, 'artist-uuid');
    expect(payload.start_at).toBe(new Date('2026-07-10T14:00').toISOString());
    expect(payload.end_at).toBe(new Date('2026-07-10T16:00').toISOString());
    expect(payload.artist_id).toBe('artist-uuid');
  });

  it('booth vacío viaja como null (el API lo acepta nullable)', () => {
    expect(valuesToPayload(values, 'a').booth_id).toBeNull();
  });

  it('opcionales vacíos se omiten en vez de mandar strings vacíos', () => {
    const payload = valuesToPayload(values, 'a');
    expect(payload.estimated_price).toBeUndefined();
    expect(payload.client_phone).toBeUndefined();
    expect(payload.notes).toBeUndefined();
  });
});
