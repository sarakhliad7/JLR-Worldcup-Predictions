'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale } from '../../lib/i18n/LocaleContext';

const NAV = [
  { href: '/admin', labelKey: 'admin_nav_dashboard', exact: true },
  { href: '/admin/employees', labelKey: 'admin_nav_employees' },
  { href: '/admin/departments', labelKey: 'admin_nav_departments' },
  { href: '/admin/matches', labelKey: 'admin_nav_matches' },
  { href: '/admin/announcements', labelKey: 'admin_nav_announcements' },
  { href: '/admin/Predictions
  { href: '/admin/rewards', label: 'Rewards' },', labelKey: 'admin_nav_Predictions
  { href: '/admin/rewards', label: 'Rewards' },' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/Predictions
  { href: '/admin/rewards', label: 'Rewards' },');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-ink-faint text-sm">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex">
      <aside className="w-60 shrink-0 border-e border-card-border/60 bg-card-soft min-h-screen p-5 hidden md:flex md:flex-col">
        <div className="flex items-center gap-2 mb-8">
          <img src="/jlr-logo-tan.png" alt="JLR" className="h-6 w-auto" />
          <span className="font-display font-bold text-ink">{t('admin_title')}</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-ring ${
                  active ? 'bg-gold text-white' : 'text-ink-body hover:bg-white/50'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 pt-4 border-t border-card-border/60">
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="w-full text-start rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-body hover:bg-white/50 focus-ring"
          >
            {locale === 'en' ? 'ط§ظ„ط¹ط±ط¨ظٹط©' : 'English'}
          </button>
          <Link
            href="/Predictions
  { href: '/admin/rewards', label: 'Rewards' },"
            className="block rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-body hover:bg-white/50 focus-ring"
          >
            â†گ {t('admin_backToSite')}
          </Link>
        </div>
      </aside>

      {/* Mobile top bar (admin on small screens) */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-card-soft border-b border-card-border/60 px-4 h-14 flex items-center justify-between">
        <span className="font-display font-bold text-sm">{t('admin_title')}</span>
        <Link href="/Predictions
  { href: '/admin/rewards', label: 'Rewards' }," className="text-xs font-semibold text-gold-dark">
          {t('admin_backToSite')}
        </Link>
      </div>

      <main className="flex-1 min-w-0 p-5 md:p-8 pt-20 md:pt-8">
        {/* Mobile nav chips */}
        <nav className="md:hidden flex gap-2 overflow-x-auto pb-4 -mt-2 mb-2 scrollbar-none">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap focus-ring ${
                  active ? 'bg-gold text-white' : 'bg-white/50 text-ink-body border border-card-border/60'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
