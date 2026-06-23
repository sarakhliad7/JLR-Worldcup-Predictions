'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '../../../lib/i18n/LocaleContext';

export default function AdminPredictionsPage() {
  const { t, locale } = useLocale();
  const [predictions, setPredictions] = useState(null);
  const [matches, setMatches] = useState([]);
  const [filterMatch, setFilterMatch] = useState('');

  async function load() {
    const [predRes, matchRes] = await Promise.all([
      fetch(`/api/admin/predictions${filterMatch ? `?matchId=${filterMatch}` : ''}`).then((r) => r.json()),
      fetch('/api/admin/matches').then((r) => r.json()),
    ]);
    setPredictions(predRes.predictions || []);
    setMatches(matchRes.matches || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMatch]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">{t('admin_predictions_title')}</h1>
        <p className="text-ink-faint text-sm mt-1">{t('admin_predictions_subtitle')}</p>
      </div>

      <select
        value={filterMatch}
        onChange={(e) => setFilterMatch(e.target.value)}
        className="w-full sm:w-80 rounded-xl bg-card-soft border border-card-border/60 text-ink px-4 py-2.5 text-sm focus-ring"
      >
        <option value="">{t('admin_predictions_allMatches')}</option>
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.homeTeam?.nameEn || m.homeTeamLabel} vs {m.awayTeam?.nameEn || m.awayTeamLabel} — {m.round}
          </option>
        ))}
      </select>

      <div className="rounded-card bg-card-soft border border-card-border/60 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border/60 text-ink-faint">
              <th className="px-4 py-3 text-start font-semibold">{t('admin_predictions_employee')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin_matches_homeTeam')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin_predictions_pick')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin_matches_status')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin_predictions_points')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin_predictions_submittedAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border/40">
            {predictions?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-ink font-medium">
                  {p.user.name}
                  <span className="block text-ink-faint text-xs">{p.user.department}</span>
                </td>
                <td className="px-4 py-3 text-ink-body">{p.match.homeTeam} vs {p.match.awayTeam}</td>
                <td className="px-4 py-3 font-tabular text-ink">{p.predHomeScore} : {p.predAwayScore}</td>
                <td className="px-4 py-3 text-ink-faint text-xs">
                  {p.match.homeScore != null ? `${p.match.homeScore} : ${p.match.awayScore}` : t('admin_matches_noResult')}
                </td>
                <td className="px-4 py-3 font-tabular font-semibold text-gold-dark">
                  {p.pointsAwarded ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink-faint text-xs">
                  {new Date(p.createdAt).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {predictions?.length === 0 && (
          <p className="text-ink-faint text-center py-10 text-sm">{t('admin_predictions_noneYet')}</p>
        )}
      </div>
    </div>
  );
}
