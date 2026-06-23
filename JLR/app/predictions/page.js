'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RoundFilterChips from '../../components/RoundFilterChips';
import MatchCard from '../../components/MatchCard';
import ChampionChallengeCard from '../../components/ChampionChallengeCard';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function PredictionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  const [filter, setFilter] = useState('upcoming');
  const [matches, setMatches] = useState(null);
  const [me, setMe] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/matches?filter=${filter}`);
    const data = await res.json();
    setMatches(data.matches || []);
  }, [filter]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      load();
      fetch('/api/me').then((r) => r.json()).then((d) => setMe(d.user));
    }
  }, [status, load]);

  const pendingCount = matches?.filter((m) => !m.myPrediction && !m.locked && m.homeTeam && m.awayTeam).length;

  return (
    <div className="px-4 pt-4 space-y-5">
      <div>
        {me && (
          <p className="text-ink-body text-sm mb-1">
            {t('pred_greeting')} <span className="text-ink font-semibold">{me.name}</span>
          </p>
        )}
        <h2 className="font-display font-bold text-2xl text-ink">{t('pred_title')}</h2>
        <p className="text-ink-faint text-xs mt-1">{t('pred_rulesHint')}</p>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl bg-gold/10 border border-gold/30 px-4 py-2.5 text-sm text-gold-dark flex items-center gap-2">
          <span>⚽</span>
          {pendingCount} {t('pred_pendingCount')}
        </div>
      )}

      <ChampionChallengeCard />

      <RoundFilterChips value={filter} onChange={setFilter} />

      <div className="space-y-3">
        {matches === null && (
          <p className="text-ink-faint text-center py-10 text-sm">{t('loading')}</p>
        )}
        {matches?.length === 0 && (
          <p className="text-ink-faint text-center py-10 text-sm">{t('pred_noMatches')}</p>
        )}
        {matches?.map((m) => (
          <MatchCard key={m.id} match={m} onSaved={load} />
        ))}
      </div>
    </div>
  );
}
