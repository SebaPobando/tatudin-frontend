import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage, getRequestId } from '@/api/errors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Red de seguridad para errores de render no capturados. Los errores de datos
 * ya se muestran en cada página vía el estado `isError` de TanStack Query;
 * este boundary evita la pantalla en blanco si algo revienta al renderizar,
 * y expone el X-Request-ID cuando el error viene de una request al backend
 * (para que la tatuadora pueda reportarlo con un código correlacionable).
 *
 * Los error boundaries DEBEN ser componentes de clase: no hay equivalente en
 * hooks para getDerivedStateFromError / componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En prod esto lo recogería Sentry; en dev, a la consola.
    console.error('ErrorBoundary capturó:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const requestId = getRequestId(error);
    const message = getApiErrorMessage(error);

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Algo salió mal</h1>
        <p className="text-muted-foreground text-sm">
          {message !== 'Ocurrió un error inesperado.'
            ? message
            : 'Ocurrió un error inesperado en la aplicación. Puedes recargar para continuar.'}
        </p>
        {requestId && (
          <p className="text-muted-foreground text-xs">
            Código para reporte: <span className="font-mono">{requestId}</span>
          </p>
        )}
        <Button className="rounded-full font-semibold" onClick={this.handleReload}>
          <RotateCw /> Recargar
        </Button>
      </main>
    );
  }
}
