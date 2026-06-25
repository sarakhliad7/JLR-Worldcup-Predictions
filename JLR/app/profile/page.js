'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then(setData);
  }, []);

  if (!data?.user) {
    return <p className="text-ink-faint text-center py-10 text-sm">{t('loading')}</p>;
  }

  const { user } = data;
  const departmentName = locale === 'ar' ? user.departmentAr || user.department : user.department;
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="px-4 pt-4 space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink">{t('profile_title')}</h2>
      </div>

      <div className="rounded-card bg-gradient-to-br from-card-soft to-cream-deep border border-card-border/60 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center font-display font-bold text-xl text-gold-dark">
            {user.avatarLabel}
          </div>
          <div>
            <h3 className="font-bold text-lg text-ink">{user.name}</h3>
            <p className="text-ink-faint text-xs mt-0.5">
              {departmentName ? `${departmentName} · ` : ''}{t('profile_rank')} #{user.rank}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/40 rounded-xl py-3 text-center">
            <p className="font-tabular text-2xl font-bold text-flare">🔥 {user.currentStreak}</p>
            <p className="text-ink-faint text-xs mt-1">{t('profile_streak')}</p>
          </div>
          <div className="bg-white/40 rounded-xl py-3 text-center">
            <p className="font-tabular text-2xl font-bold text-gold-dark">{user.totalPoints}</p>
            <p className="text-ink-faint text-xs mt-1">{t('profile_points')}</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="block rounded-xl bg-gold/10 border border-gold/30 px-4 py-3 text-sm font-semibold text-gold-dark text-center focus-ring"
        >
          {t('admin_title')} →
        </Link>
      )}

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full text-flare text-sm font-semibold py-3 focus-ring"
      >
        {t('profile_signOut')}
      </button>
    </div>
  );
}