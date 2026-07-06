import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Layout de toda el área autenticada:
 * - Móvil: TopBar + contenido + BottomNav fija (padding-bottom para no taparlo)
 * - Desktop: Sidebar fija de 15rem + contenido con margen izquierdo
 */
export function AppShell() {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <TopBar />
      <div className="pb-20 md:ml-60 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
