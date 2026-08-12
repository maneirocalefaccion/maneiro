import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'Maneiro Climatización - ERP',
  description: 'Sistema de gestión integral para Maneiro Climatización',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <header className="topbar">
                <span className="topbar-text">Sistema ERP - Sucursal Coronel Suárez</span>
                <button className="btn btn-ghost btn-sm">Cerrar Sesión</button>
              </header>
              <div className="page-container">{children}</div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
