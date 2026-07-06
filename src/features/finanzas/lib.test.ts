import { describe, expect, it } from 'vitest';
import { paymentSchema, valuesToPaymentPayload } from './lib';

const valid = {
  appointment_id: '',
  payer_name: 'Ana Pérez',
  amount: '350000.00',
  payment_method: 'cash' as const,
  notes: '',
  splits: [
    { recipient_id: 'artist-uuid', percentage: '70.00' },
    { recipient_id: '', percentage: '30.00' },
  ],
};

describe('paymentSchema — validación de splits con Decimal', () => {
  it('acepta splits que suman 100.00 exactos', () => {
    expect(paymentSchema.safeParse(valid).success).toBe(true);
  });

  it('acepta 33.33 + 33.33 + 33.34 (donde los floats fallarían)', () => {
    const result = paymentSchema.safeParse({
      ...valid,
      splits: [
        { recipient_id: 'a', percentage: '33.33' },
        { recipient_id: 'b', percentage: '33.33' },
        { recipient_id: '', percentage: '33.34' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza suma distinta de 100 con el total en el mensaje', () => {
    const result = paymentSchema.safeParse({
      ...valid,
      splits: [{ recipient_id: '', percentage: '90.00' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('90.00');
    }
  });

  it('rechaza destinatarios repetidos', () => {
    const result = paymentSchema.safeParse({
      ...valid,
      splits: [
        { recipient_id: '', percentage: '50.00' },
        { recipient_id: '', percentage: '50.00' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza monto 0', () => {
    expect(paymentSchema.safeParse({ ...valid, amount: '0' }).success).toBe(false);
  });
});

describe('valuesToPaymentPayload', () => {
  it("recipient_id '' viaja como null (split del estudio)", () => {
    const payload = valuesToPaymentPayload(valid);
    expect(payload.splits[1].recipient_id).toBeNull();
    expect(payload.splits[0].recipient_id).toBe('artist-uuid');
  });

  it('appointment_id vacío se omite', () => {
    expect(valuesToPaymentPayload(valid).appointment_id).toBeUndefined();
  });
});
