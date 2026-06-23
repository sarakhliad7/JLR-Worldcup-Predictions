'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '../lib/i18n/LocaleContext';

export default function ChampionChallengeCard() {
  const { t, locale } = useLocale();
  const [data, setData] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/champion-pick').then((r) => r.json()).then(setData);
  }, []);

  async function pick(teamId) {
    setSaving(true);
    try {
      const res = await fetch('/api/champion-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      if (res.ok) {
        const fresh = await fetch('/api/champion-pick').then((r) => r.json());
        setData(fresh);
        setSelecting(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;

  const { pick: existingPick, teams, locked } = data;

  function teamName(team) {
    return locale === 'ar' ? team.nameAr || team.nameEn : team.nameEn;
  }

  return (
    <div className="rounded-card bg-gradient-to-br from-card-soft to-cream-deep border border-gold/25 shadow-sm p-4">
      <p className="text-gold-eyebrow text-xs font-bold mb-1 flex items-center gap-1.5">
        <span>🏆</span> {t('champion_eyebrow')}
      </p>
      <h3 className="font-bold text-ink mb-1">{t('champion_title')}</h3>
      <p className="text-ink-body text-sm mb-3">{t('champion_bonus')}</p>

      {existingPick && !selecting ? (
        <div className="flex items-center justify-between bg-white/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{existingPick.team.flagEmoji || '🏳️'}</span>
            <span className="text-ink font-semibold text-sm">{teamName(existingPick.team)}</span>
          </div>
          {!locked && (
            <button onClick={() => setSelecting(true)} className="text-gold-dark text-sm font-semibold focus-ring">
              {t('change')}
            </button>
          )}
        </div>
      ) : locked ? (
        <p className="text-ink-faint text-sm">{t('champion_locked')}</p>
      ) : (
        <select
          disabled={saving}
          defaultValue=""
          onChange={(e) => e.target.value && pick(e.target.value)}
          className="w-full rounded-xl bg-white/60 border border-card-border/70 text-ink px-4 py-2.5 text-sm focus-ring"
        >
          <option value="" disabled>
            {t('champion_selectTeam')}
          </option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {teamName(team)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
