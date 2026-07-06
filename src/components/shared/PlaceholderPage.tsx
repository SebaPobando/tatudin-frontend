import { Construction } from 'lucide-react';

/** Página temporal para secciones cuya fase aún no llega. */
export function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-2xl">
        <Construction className="size-6" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-xs text-sm">
        Esta sección se construye en la Fase {phase} del roadmap.
      </p>
    </main>
  );
}
