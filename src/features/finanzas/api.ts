import { api } from '@/api/client';
import type {
  Account,
  Expense,
  ExpenseCategory,
  Paginated,
  Payment,
  PaymentMethod,
} from '@/types/api';

// ── Pagos (inmutables: solo create/list/retrieve) ────────────────

export interface CreatePaymentPayload {
  appointment_id?: string;
  payer_name: string;
  amount: string;
  payment_method: PaymentMethod;
  notes?: string;
  /** recipient_id null → split para el estudio. Deben sumar 100.00 exactos. */
  splits: { recipient_id: string | null; percentage: string }[];
}

export async function getPayments(page = 1): Promise<Paginated<Payment>> {
  const { data } = await api.get<Paginated<Payment>>('/api/finanzas/payments/', {
    params: { page },
  });
  return data;
}

export async function getPayment(id: string): Promise<Payment> {
  const { data } = await api.get<Payment>(`/api/finanzas/payments/${id}/`);
  return data;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const { data } = await api.post<Payment>('/api/finanzas/payments/', payload);
  return data;
}

// ── Gastos ───────────────────────────────────────────────────────

export interface ExpensePayload {
  category?: string | null;
  paid_by?: string | null;
  amount: string;
  description: string;
  expense_date: string;
  payment_method?: PaymentMethod;
  receipt_url?: string;
  notes?: string;
}

export async function getExpenses(params: {
  category?: string;
  page?: number;
}): Promise<Paginated<Expense>> {
  const { data } = await api.get<Paginated<Expense>>('/api/finanzas/expenses/', {
    params: { category: params.category || undefined, page: params.page ?? 1 },
  });
  return data;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const { data } = await api.post<Expense>('/api/finanzas/expenses/', payload);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/api/finanzas/expenses/${id}/`);
}

// ── Categorías de gasto (owner/admin) ────────────────────────────

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data } = await api.get<Paginated<ExpenseCategory>>('/api/finanzas/expense-categories/', {
    params: { page_size: 100 },
  });
  return data.results;
}

export async function createExpenseCategory(payload: {
  name: string;
  color?: string;
}): Promise<ExpenseCategory> {
  const { data } = await api.post<ExpenseCategory>('/api/finanzas/expense-categories/', payload);
  return data;
}

export async function updateExpenseCategory(
  id: string,
  payload: Partial<{ name: string; color: string; is_active: boolean }>,
): Promise<ExpenseCategory> {
  const { data } = await api.patch<ExpenseCategory>(
    `/api/finanzas/expense-categories/${id}/`,
    payload,
  );
  return data;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await api.delete(`/api/finanzas/expense-categories/${id}/`);
}

// ── Cuentas (solo lectura; creadas lazily por el service de pagos) ──

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<Paginated<Account>>('/api/finanzas/accounts/', {
    params: { page_size: 100 },
  });
  return data.results;
}
