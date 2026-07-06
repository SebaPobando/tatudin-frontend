import Decimal from 'decimal.js';
import { z } from 'zod';
import type { PaymentMethod } from '@/types/api';
import type { CreatePaymentPayload } from './api';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
};

const decimalString = (message: string) =>
  z.string().refine((v) => /^\d+(\.\d{1,2})?$/.test(v), message);

/**
 * REGLA DE ORO del proyecto: la suma de porcentajes se valida con decimal.js,
 * NUNCA con Number. 33.33 + 33.33 + 33.34 en floats da 99.99999999999999 y
 * el backend (que sí usa Decimal) lo rechazaría — o peor, lo aceptaría aquí
 * y fallaría allá. Con Decimal la suma es exacta.
 */
export const paymentSchema = z
  .object({
    appointment_id: z.string(),
    payer_name: z.string().min(1, 'El nombre de quien paga es requerido.'),
    amount: decimalString('Monto inválido — usa formato 350000 o 350000.00.').refine(
      (v) => new Decimal(v).greaterThan(0),
      'El monto debe ser mayor que 0.',
    ),
    payment_method: z.enum(['cash', 'card', 'transfer', 'other'], 'Elige un método de pago.'),
    notes: z.string(),
    splits: z
      .array(
        z.object({
          recipient_id: z.string(), // '' = estudio
          percentage: decimalString('Porcentaje inválido.'),
        }),
      )
      .min(1, 'Agrega al menos un split.'),
  })
  .superRefine((values, ctx) => {
    const sum = values.splits.reduce(
      (acc, s) => acc.plus(/^\d+(\.\d{1,2})?$/.test(s.percentage) ? s.percentage : 0),
      new Decimal(0),
    );
    if (!sum.equals(100)) {
      ctx.addIssue({
        code: 'custom',
        path: ['splits'],
        message: `Los porcentajes deben sumar exactamente 100.00 — llevan ${sum.toFixed(2)}.`,
      });
    }
    const ids = values.splits.map((s) => s.recipient_id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['splits'],
        message: 'Hay destinatarios repetidos en los splits.',
      });
    }
  });

export type PaymentValues = z.infer<typeof paymentSchema>;

export function valuesToPaymentPayload(values: PaymentValues): CreatePaymentPayload {
  return {
    appointment_id: values.appointment_id || undefined,
    payer_name: values.payer_name,
    amount: values.amount,
    payment_method: values.payment_method,
    notes: values.notes || undefined,
    splits: values.splits.map((s) => ({
      recipient_id: s.recipient_id || null,
      percentage: s.percentage,
    })),
  };
}

export const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida.'),
  amount: decimalString('Monto inválido.').refine(
    (v) => new Decimal(v).greaterThan(0),
    'El monto debe ser mayor que 0.',
  ),
  expense_date: z.string().min(1, 'La fecha es requerida.'),
  payment_method: z.string(),
  category: z.string(),
  notes: z.string(),
});

export type ExpenseValues = z.infer<typeof expenseSchema>;
