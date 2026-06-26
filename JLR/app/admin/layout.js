'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/departments', label: 'Departments' },
  { href: '/admin/matches', label: 'Matches' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/predictions', label: 'Predictions' }
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream text-ink-heading">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-card-border bg-white/60 p-6 md:flex md:flex-col">
          <div className="mb-12 flex items-center gap-3">
            <span className="text-3xl font-light text-brand">JLR</span>
            <span className="text-xl font-bold">Admin</span>
          </div>

          <nav className="flex flex-col gap-3">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-5 py-4 text-base font-bold transition ${
                    active
                      ? 'bg-brand text-white'
                      : 'text-ink-muted hover:bg-white hover:text-ink-heading'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-card-border pt-6">
            <Link href="/" className="text-sm font-bold text-ink-muted">
              ← Back to site
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
