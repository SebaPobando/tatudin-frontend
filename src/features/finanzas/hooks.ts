import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant';
import * as finanzasApi from './api';
import type { CreatePaymentPayload, ExpensePayload } from './api';

export function usePayments(page = 1) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['payments', 'list', tenantId, page],
    queryFn: () => finanzasApi.getPayments(page),
    placeholderData: (prev) => prev,
  });
}

export function usePayment(id: string) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['payments', 'detail', id, tenantId],
    queryFn: () => finanzasApi.getPayment(id),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => finanzasApi.createPayment(payload),
    onSuccess: () => {
      // un pago mueve pagos, saldos de cuentas y el P&L del dashboard
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['pnl'] });
    },
  });
}

export function useExpenses(params: { category?: string; page?: number }) {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['expenses', 'list', tenantId, params],
    queryFn: () => finanzasApi.getExpenses(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['pnl'] });
  };
}

export function useCreateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (payload: ExpensePayload) => finanzasApi.createExpense(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (id: string) => finanzasApi.deleteExpense(id),
    onSuccess: invalidate,
  });
}

export function useExpenseCategories() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['expense-categories', tenantId],
    queryFn: finanzasApi.getExpenseCategories,
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
}

export function useCreateExpenseCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (payload: { name: string; color?: string }) =>
      finanzasApi.createExpenseCategory(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateExpenseCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      color?: string;
      is_active?: boolean;
    }) => finanzasApi.updateExpenseCategory(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteExpenseCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => finanzasApi.deleteExpenseCategory(id),
    onSuccess: invalidate,
  });
}

export function useAccounts() {
  const tenantId = useTenantStore((s) => s.activeTenant?.id);
  return useQuery({
    queryKey: ['accounts', tenantId],
    queryFn: finanzasApi.getAccounts,
  });
}
