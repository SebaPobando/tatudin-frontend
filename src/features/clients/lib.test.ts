import { describe, expect, it } from 'vitest';
import { valuesToClientPayload } from './lib';

const values = {
  first_name: 'Ana',
  last_name: '',
  email: '',
  phone: '',
  birthdate: '',
  source: 'instagram',
  tags: ' flash , blackwork,, ',
  notes: '',
};

describe('valuesToClientPayload', () => {
  it('separa tags por coma limpiando espacios y vacíos', () => {
    expect(valuesToClientPayload(values).tags).toEqual(['flash', 'blackwork']);
  });

  it('omite opcionales vacíos en vez de mandar strings vacíos', () => {
    const payload = valuesToClientPayload({ ...values, tags: '', source: '' });
    expect(payload.email).toBeUndefined();
    expect(payload.birthdate).toBeUndefined();
    expect(payload.tags).toBeUndefined();
    expect(payload.source).toBeUndefined();
  });
});
