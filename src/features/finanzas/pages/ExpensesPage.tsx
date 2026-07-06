import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import type { Expense } from '@/types/api';
import { expenseSchema, PAYMENT_METHOD_LABEL, type ExpenseValues } from '../lib';
import { useCreateExpense, useDeleteExpense, useExpenseCategories, useExpenses } from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function ExpenseForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (values: ExpenseValues) => void;
  onCancel: () => void;
}) {
  const categories = useExpenseCategories();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: '',
      category: '',
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exp-description">Descripción</Label>
        <Input id="exp-description" placeholder="Agujas y cartuchos" {...register('description')} />
        {errors.description && (
          <p className="text-destructive text-xs">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-amount">Monto</Label>
          <Input id="exp-amount" inputMode="decimal" placeholder="120000" {...register('amount')} />
          {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-date">Fecha</Label>
          <Input id="exp-date" type="date" {...register('expense_date')} />
          {errors.expense_date && (
            <p className="text-destructive text-xs">{errors.expense_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-method">Método (opcional)</Label>
          <select id="exp-method" className={selectClass} {...register('payment_method')}>
            <option value="">Sin especificar</option>
            {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-category">Categoría (opcional)</Label>
          <select id="exp-category" className={selectClass} {...register('category')}>
            <option value="">Sin categoría</option>
            {categories.data
              ?.filter((c) => c.is_active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 rounded-full font-semibold" disabled={pending}>
          {pending ? 'Guardando…' : 'Registrar gasto'}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ExpenseItem({ expense }: { expense: Expense }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteMutation = useDeleteExpense();

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{expense.description}</p>
          <p className="text-muted-foreground truncate text-xs">
            {format(parseISO(expense.expense_date), 'dd/MM/yyyy')}
            {expense.category_name && ` · ${expense.category_name}`}
            {expense.payment_method &&
              ` · ${PAYMENT_METHOD_LABEL[expense.payment_method as keyof typeof PAYMENT_METHOD_LABEL]}`}
          </p>
        </div>
        <p className="shrink-0 font-bold">{formatMoney(expense.amount)}</p>

        {confirmingDelete ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(expense.id)}
            >
              Sí
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setConfirmingDelete(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar gasto ${expense.description}`}
            className="text-destructive rounded-full"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpensesPage() {
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const expenses = useExpenses({ category });
  const categories = useExpenseCategories();
  const createMutation = useCreateExpense();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/finanzas" aria-label="Volver a finanzas">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Gastos</h2>
          {expenses.data && (
            <p className="text-muted-foreground text-xs">{expenses.data.count} registrados</p>
          )}
        </div>
        {!creating && (
          <Button className="rounded-full font-semibold" onClick={() => setCreating(true)}>
            <Plus /> Nuevo
          </Button>
        )}
      </header>

      {categories.data && categories.data.length > 0 && (
        <select
          aria-label="Filtrar por categoría"
          className={selectClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {creating && (
        <Card>
          <CardContent>
            <ExpenseForm
              pending={createMutation.isPending}
              onSubmit={(values) =>
                createMutation.mutate(
                  {
                    description: values.description,
                    amount: values.amount,
                    expense_date: values.expense_date,
                    payment_method:
                      (values.payment_method as Expense['payment_method']) || undefined,
                    category: values.category || undefined,
                    notes: values.notes || undefined,
                  },
                  { onSuccess: () => setCreating(false) },
                )
              }
              onCancel={() => setCreating(false)}
            />
            {createMutation.isError && (
              <p role="alert" className="text-destructive mt-2 text-sm">
                {getApiErrorMessage(createMutation.error)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {expenses.isPending && <p className="text-muted-foreground text-sm">Cargando gastos…</p>}
      {expenses.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(expenses.error)}
        </p>
      )}
      {expenses.data?.count === 0 && !creating && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Sin gastos registrados{category ? ' en esta categoría' : ''}.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {expenses.data?.results.map((e) => (
          <li key={e.id}>
            <ExpenseItem expense={e} />
          </li>
        ))}
      </ul>
    </main>
  );
}
