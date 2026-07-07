import { describe, expect, it } from 'vitest';
import type { PublicFormField } from '@/types/api';
import { buildSubmitPayload, validateRequired } from './lib';

function field(overrides: Partial<PublicFormField>): PublicFormField {
  return {
    id: crypto.randomUUID(),
    field_type: 'text',
    label: 'Campo',
    help_text: '',
    placeholder: '',
    required: false,
    order: 10,
    options: null,
    min_length: null,
    max_length: null,
    ...overrides,
  };
}

describe('buildSubmitPayload', () => {
  it('arma answers con field_id/value y deriva visitor_*', () => {
    const nombre = field({ field_type: 'text', label: 'Tu nombre' });
    const email = field({ field_type: 'email', label: 'Tu email' });
    const phone = field({ field_type: 'phone', label: 'Teléfono' });
    const payload = buildSubmitPayload([nombre, email, phone], {
      [nombre.id]: 'Ana Curiosa',
      [email.id]: 'ana@mail.com',
      [phone.id]: '+57 300 111 2233',
    });

    expect(payload.answers).toHaveLength(3);
    expect(payload.answers[0]).toEqual({ field_id: nombre.id, value: 'Ana Curiosa' });
    expect(payload.visitor_name).toBe('Ana Curiosa');
    expect(payload.visitor_email).toBe('ana@mail.com');
    expect(payload.visitor_phone).toBe('+57 300 111 2233');
  });

  it('multiselect → string separado por comas; checkbox → Sí/No', () => {
    const zonas = field({ field_type: 'multiselect', options: ['Brazo', 'Pierna'] });
    const primera = field({ field_type: 'checkbox', label: '¿Primer tatuaje?' });
    const payload = buildSubmitPayload([zonas, primera], {
      [zonas.id]: ['Brazo', 'Pierna'],
      [primera.id]: true,
    });

    expect(payload.answers.find((a) => a.field_id === zonas.id)?.value).toBe('Brazo, Pierna');
    expect(payload.answers.find((a) => a.field_id === primera.id)?.value).toBe('Sí');
  });

  it('respuestas vacías no viajan', () => {
    const opcional = field({ label: 'Opcional' });
    expect(buildSubmitPayload([opcional], {}).answers).toHaveLength(0);
  });
});

describe('validateRequired', () => {
  it('detecta requeridos vacíos incluyendo multiselect vacío', () => {
    const nombre = field({ required: true });
    const zonas = field({ field_type: 'multiselect', required: true, options: ['A', 'B'] });
    const errors = validateRequired([nombre, zonas], { [zonas.id]: [] });
    expect(Object.keys(errors)).toHaveLength(2);
  });

  it('sin errores cuando todo requerido tiene valor', () => {
    const nombre = field({ required: true });
    expect(validateRequired([nombre], { [nombre.id]: 'Ana' })).toEqual({});
  });
});
