import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Book Moar — Managed CRM & Workflow Automation Platform',
  description: 'Multi-client, owner-controlled CRM and workflow automation platform for local service businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-sky-500 text-white font-black px-2.5 py-1 rounded text-lg tracking-wider">
                BM
              </div>
              <span className="font-bold text-xl tracking-tight">Book Moar</span>
              <span className="text-xs bg-slate-800 text-sky-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                Managed Platform v1.0
              </span>
            </div>

            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/admin" className="text-slate-300 hover:text-white transition flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Master Admin
              </Link>
              <Link href="/client/tenant_tyrees_auto/crm" className="text-slate-300 hover:text-white transition">
                Tyree's CRM
              </Link>

              <Link href="/client/tenant_tyrees_auto/workflows" className="text-slate-300 hover:text-white transition">
                Workflows
              </Link>
              <Link href="/site/tenant_tyrees_auto" className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-md font-semibold text-xs transition">
                View Client Site &rarr;
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            Book Moar Platform &copy; {new Date().getFullYear()} — Owner-Controlled Managed CRM & Automation Infrastructure.
          </div>
        </footer>
      </body>
    </html>
  );
}
