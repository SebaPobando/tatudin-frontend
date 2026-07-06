import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/api/errors';
import type { ClientSource } from '@/types/api';
import { SOURCE_LABEL } from '../lib';
import { useClients } from '../hooks';

const selectClass =
  'border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const clients = useClients({ search, source, page });

  const totalPages = clients.data ? Math.max(1, Math.ceil(clients.data.count / 25)) : 1;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          {clients.data && (
            <p className="text-muted-foreground text-xs">{clients.data.count} en total</p>
          )}
        </div>
        <Button className="rounded-full font-semibold" asChild>
          <Link to="/clientes/nuevo">
            <Plus /> Nuevo
          </Link>
        </Button>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre, email o teléfono…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filtrar por fuente"
          className={selectClass}
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas las fuentes</option>
          {(Object.keys(SOURCE_LABEL) as ClientSource[]).map((value) => (
            <option key={value} value={value}>
              {SOURCE_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      {clients.isPending && <p className="text-muted-foreground text-sm">Cargando clientes…</p>}
      {clients.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(clients.error)}
        </p>
      )}
      {clients.data?.count === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {search || source
              ? 'Nada por aquí con esos filtros.'
              : 'Tu base de clientes está vacía. Crea el primero.'}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {clients.data?.results.map((c) => (
          <li key={c.id}>
            <Link
              to={`/clientes/${c.id}`}
              className="bg-card hover:bg-accent/40 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <span className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.full_name || c.first_name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {[c.phone, c.email].filter(Boolean).join(' · ') || 'Sin contacto'}
                </p>
              </div>
              {c.source && (
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
                  {SOURCE_LABEL[c.source]}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {clients.data && totalPages > 1 && (
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
            disabled={!clients.data.next}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </main>
  );
}
