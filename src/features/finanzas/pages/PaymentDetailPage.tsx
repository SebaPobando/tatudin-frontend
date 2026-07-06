import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import { PAYMENT_METHOD_LABEL } from '../lib';
import { usePayment } from '../hooks';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const payment = usePayment(id!);

  if (payment.isPending) {
    return <p className="text-muted-foreground p-6 text-sm">Cargando pago…</p>;
  }
  if (payment.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {getApiErrorMessage(payment.error)}
      </p>
    );
  }

  const p = payment.data;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-2xl" asChild>
          <Link to="/finanzas" aria-label="Volver a finanzas">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight">{formatMoney(p.amount)}</h2>
          <p className="text-muted-foreground text-xs capitalize">
            {format(parseISO(p.created_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </p>
        </div>
        {p.status === 'refunded' && (
          <span className="bg-destructive/10 text-destructive rounded-full px-3 py-1 text-xs font-semibold">
            Reembolsado
          </span>
        )}
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Row label="Pagó">{p.payer_name}</Row>
          <Row label="Método">{PAYMENT_METHOD_LABEL[p.payment_method]}</Row>
          <Row label="Registrado por">{p.registered_by_email}</Row>
          {p.notes && <Row label="Notas">{p.notes}</Row>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reparto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {p.splits.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground min-w-0 truncate">{s.account_name}</span>
              <span className="shrink-0 font-medium">
                {s.percentage}% · {formatMoney(s.amount)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        Los pagos son inmutables. Para corregir, se registra un pago compensatorio.
      </p>
    </main>
  );
}
