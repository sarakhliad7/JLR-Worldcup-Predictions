'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Podium from '../../components/Podium';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function RewardsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/leaderboard').then((r) => r.json()).then((d) => setLeaderboard(d.leaderboard || []));
  }, []);

  const top3 = leaderboard?.slice(0, 3);

  return (
    <div className="px-4 pt-4 space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink">{t('rewards_title')}</h2>
        <p className="text-ink-faint text-xs mt-1">{t('rewards_subtitle')}</p>
      </div>

      <div>
        <p className="text-gold-eyebrow text-xs font-bold mb-2">🏆 {t('rewards_grandPrizeEyebrow')}</p>
        <div className="rounded-card bg-gradient-to-br from-card-soft to-cream-deep border border-gold/30 shadow-sm p-5">
          <span className="text-[11px] font-bold text-gold-dark bg-gold/15 rounded-full px-2.5 py-1 inline-block mb-3">
            {t('rewards_grandPrizeEyebrow')}
          </span>
          <h3 className="font-display font-bold text-xl text-ink mb-1.5">{t('rewards_grandPrizeTitle')}</h3>
          <p className="text-ink-body text-sm leading-relaxed">
            {t('rewards_grandPrizeDesc')}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/40 border border-card-border/50 px-4 py-3 text-sm text-ink-body flex gap-2">
        <span>🔔</span>
        <span>{t('rewards_grandPrizeTbd')}</span>
      </div>

      {top3?.length > 0 && (
        <div className="bg-card-soft border border-card-border/50 rounded-card py-6 px-2">
          <Podium top3={top3} />
        </div>
      )}
    </div>
  );
}
