import { describe, expect, it } from 'vitest';
import { PROVIDER_LABEL, parseConfig } from './lib';

describe('integrations/lib', () => {
  it('etiqueta los proveedores confirmados', () => {
    expect(PROVIDER_LABEL.google_calendar).toBe('Google Calendar');
    expect(PROVIDER_LABEL.whatsapp_twilio).toBe('WhatsApp (Twilio)');
    expect(PROVIDER_LABEL.google_reviews).toBe('Google Reviews');
  });

  describe('parseConfig', () => {
    it('vacío → objeto vacío', () => {
      expect(parseConfig('')).toEqual({});
      expect(parseConfig('   ')).toEqual({});
    });
    it('objeto JSON válido', () => {
      expect(parseConfig('{ "calendar_id": "abc" }')).toEqual({ calendar_id: 'abc' });
    });
    it('rechaza JSON que no es objeto', () => {
      expect(() => parseConfig('[1,2]')).toThrow();
      expect(() => parseConfig('"x"')).toThrow();
    });
    it('rechaza JSON inválido', () => {
      expect(() => parseConfig('{ no json }')).toThrow();
    });
  });
});
