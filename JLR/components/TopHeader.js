'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from '../lib/i18n/LocaleContext';

export default function TopHeader() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();
  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-sm border-b border-card-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        <span className="font-mark text-xl font-bold text-ink/70 tracking-tight">JLR</span>
        <span className="font-display font-bold text-sm text-ink/80">{t('appName')}</span>
        <button
          type="button"
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-0.5 rounded-full border border-gold/25 bg-white/50 p-0.5 text-xs font-bold focus-ring"
          aria-label="Switch language"
        >
          <span className={`rounded-full px-2 py-1 transition-colors ${locale === 'ar' ? 'bg-gold text-white' : 'text-gold-dark'}`}>
            AR
          </span>
          <span className={`rounded-full px-2 py-1 transition-colors ${locale === 'en' ? 'bg-gold text-white' : 'text-gold-dark'}`}>
            EN
          </span>
        </button>
      </div>
    </header>
  );
}
