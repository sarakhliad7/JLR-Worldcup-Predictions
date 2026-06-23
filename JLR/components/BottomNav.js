'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '../lib/i18n/LocaleContext';

const TABS = [
  { href: '/predictions', labelKey: 'nav_predictions', icon: HomeIcon },
  { href: '/leaderboard', labelKey: 'nav_leaderboard', icon: TrophyIcon },
  { href: '/rewards', labelKey: 'nav_rewards', icon: RewardsIcon },
  { href: '/news', labelKey: 'nav_news', icon: NewsIcon },
  { href: '/profile', labelKey: 'nav_profile', icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 max-w-md mx-auto bg-card-soft backdrop-blur-md border-t border-card-border/60">
      <ul className="flex items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-ring ${
                  active ? 'text-gold-dark' : 'text-ink-faint'
                }`}
              >
                <Icon active={active} />
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinejoin="round" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
      <path d="M10 14v2h4v-2M9 20h6M12 16v4" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function RewardsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="9" width="18" height="11" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} />
      <path d="M3 13h18M12 9v11" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} />
      <path d="M12 9S9.5 4 7 4 5 7.5 7.5 9H12ZM12 9s2.5-5 5-5 2 3.5-.5 5H12Z" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinejoin="round" />
    </svg>
  );
}

function NewsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V6a2 2 0 0 1 2-2h9.5L20 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinejoin="round" />
      <path d="M8 9h6M8 12.5h8M8 16h5" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
