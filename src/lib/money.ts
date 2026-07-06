import Decimal from 'decimal.js';

/**
 * El backend envía dinero como string ("350000.00") para preservar precisión.
 * Regla del proyecto: NUNCA hacer aritmética con Number sobre montos.
 * Toda suma/resta/porcentaje pasa por Decimal; el string solo se convierte
 * a número en el punto de display (Intl.NumberFormat).
 */
export function money(value: string | number): Decimal {
  return new Decimal(value);
}

export function formatMoney(value: string | Decimal, currency = 'COP', locale = 'es-CO'): string {
  const dec = value instanceof Decimal ? value : new Decimal(value);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(dec.toNumber());
}
