import { ChevronLeft, ChevronRight, Plus, Receipt, Tags, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import { useTenantStore } from '@/stores/tenant';
import { format, parseISO } from 'date-fns';
import { PAYMENT_METHOD_LABEL } from '../lib';
import { useAccounts, usePayments } from '../hooks';

export function FinanzasPage() {
  const [page, setPage] = useState(1);
  const payments = usePayments(page);
  const accounts = useAccounts();
  const role = useTenantStore((s) => s.activeTenant?.role);
  const isStaff = role === 'owner' || role === 'admin';

  const totalPages = payments.data ? Math.max(1, Math.ceil(payments.data.count / 25)) : 1;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finanzas</h2>
          {payments.data && (
            <p className="text-muted-foreground text-xs">
              {payments.data.count} pago{payments.data.count === 1 ? '' : 's'} registrados
            </p>
          )}
        </div>
        <Button className="rounded-full font-semibold" asChild>
          <Link to="/finanzas/pagos/nuevo">
            <Plus /> Registrar pago
          </Link>
        </Button>
      </header>

      <div className="flex gap-2">
        <Button variant="outline" className="rounded-full" asChild>
          <Link to="/finanzas/gastos">
            <Receipt /> Gastos
          </Link>
        </Button>
        {isStaff && (
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/finanzas/categorias">
              <Tags /> Categorías
            </Link>
          </Button>
        )}
      </div>

      {accounts.data && accounts.data.length > 0 && (
        <section aria-label="Saldos" className="bg-card rounded-lg border">
          <h3 className="text-muted-foreground px-4 pt-4 text-[10px] font-semibold tracking-widest uppercase">
            Saldos
          </h3>
          <ul className="divide-border divide-y">
            {accounts.data.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-muted-foreground min-w-0 truncate text-sm">{a.name}</span>
                <span className="shrink-0 font-bold">{formatMoney(a.balance)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payments.isPending && <p className="text-muted-foreground text-sm">Cargando pagos…</p>}
      {payments.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(payments.error)}
        </p>
      )}
      {payments.data?.count === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <Wallet className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            Sin pagos aún. Registra el primero — el ledger y las cuentas se crean solos.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {payments.data?.results.map((p) => (
          <li key={p.id}>
            <Link
              to={`/finanzas/pagos/${p.id}`}
              className="bg-card hover:bg-accent/40 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.payer_name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {format(parseISO(p.created_at), 'dd/MM/yyyy HH:mm')} ·{' '}
                  {PAYMENT_METHOD_LABEL[p.payment_method]}
                  {p.splits.length > 1 && ` · ${p.splits.length} splits`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatMoney(p.amount)}</p>
                {p.status === 'refunded' && (
                  <span className="text-destructive text-xs font-semibold">Reembolsado</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {payments.data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Página siguiente"
            disabled={!payments.data.next}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </main>
  );
}
