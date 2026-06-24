'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '../lib/i18n/LocaleContext';

const TEAM_FLAGS = {
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  Colombia: '🇨🇴',
  Croatia: '🇭🇷',
  Denmark: '🇩🇰',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Iran: '🇮🇷',
  Italy: '🇮🇹',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  Norway: '🇳🇴',
  Paraguay: '🇵🇾',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  Spain: '🇪🇸',
  Switzerland: '🇨🇭',
  Tunisia: '🇹🇳',
  Turkey: '🇹🇷',
  Uruguay: '🇺🇾',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  'United States of America': '🇺🇸',
  Czechia: '🇨🇿',
  'Czech Republic': '🇨🇿',
  'Bosnia & Herzegovina': '🇧🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'New Zealand': '🇳🇿',
  Haiti: '🇭🇹',
  Curaçao: '🇨🇼',
  Curacao: '🇨🇼',
  Sweden: '🇸🇪',
  'Cape Verde': '🇨🇻',
  Senegal: '🇸🇳',
  'Ivory Coast': '🇨🇮',
  'Côte d’Ivoire': '🇨🇮',
  'Cote dIvoire': '🇨🇮',
  'Costa Rica': '🇨🇷',
  Panama: '🇵🇦',
  Algeria: '🇩🇿',
  Nigeria: '🇳🇬',
};

function normalizeTeamName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '');
}

function getTeamName(team, locale) {
  if (!team) return '';

  const englishName =
    team.nameEn ||
    team.name ||
    team.teamName ||
    team.country ||
    team.label ||
    '';

  if (locale === 'ar') {
    return team.nameAr || englishName;
  }

  return englishName;
}

function getTeamFlag(team, locale) {
  if (!team) return '⚽';

  const possibleNames = [
    team.nameEn,
    team.name,
    team.teamName,
    team.country,
    team.label,
    getTeamName(team, locale),
  ]
    .filter(Boolean)
    .map(normalizeTeamName);

  for (const name of possibleNames) {
    if (TEAM_FLAGS[name]) return TEAM_FLAGS[name];
  }

  return team.flagEmoji || '🏳️';
}

function StatusBadge({ status, locked, t }) {
  if (status === 'FINISHED') {
    return (
      <span className="text-[11px] font-semibold text-ink-faint bg-ink/5 rounded-full px-2.5 py-0.5">
        {t('status_finished')}
      </span>
    );
  }

  if (status === 'LIVE') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-flare bg-flare-dim/15 rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-flare animate-pulseDot" />
        {t('status_live')}
      </span>
    );
  }

  if (locked) {
    return (
      <span className="text-[11px] font-semibold text-ink-faint bg-ink/5 rounded-full px-2.5 py-0.5">
        {t('status_locked')}
      </span>
    );
  }

  return null;
}

function TeamLabel({ team, label, locale }) {
  if (team) {
    const name = getTeamName(team, locale);
    const flag = getTeamFlag(team, locale);

    return (
      <div className="flex flex-col items-center gap-1.5 w-20">
        <span className="text-3xl leading-none">{flag}</span>
        <span className="text-xs text-ink/85 text-center leading-tight">
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5 w-20">
      <span className="text-2xl leading-none opacity-40">⚽</span>
      <span className="text-[11px] text-ink-faint text-center leading-tight">
        {label || '—'}
      </span>
    </div>
  );
}

export default function MatchCard({ match, onSaved }) {
  const { t, locale } = useLocale();
  const [home, setHome] = useState(match.myPrediction?.predHomeScore ?? 0);
  const [away, setAway] = useState(match.myPrediction?.predAwayScore ?? 0);
  const [editing, setEditing] = useState(!match.myPrediction);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    console.log('MATCH DEBUG:', {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeTeamLabel: match.homeTeamLabel,
      awayTeamLabel: match.awayTeamLabel,
    });
  }, [match]);

  const canPredict = match.homeTeam && match.awayTeam && !match.locked;
  const kickoff = new Date(match.kickoffAt);
  const dateLocale = locale === 'ar' ? 'ar' : 'en-GB';

  async function save() {
    setSaving(true);
    setErr('');

    try {
      const res = await fetch(`/api/predictions/${match.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predHomeScore: home, predAwayScore: away }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(t(data.error) || t('pred_saveFailed'));

      setEditing(false);
      onSaved?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-4 animate-riseIn">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-ink-faint">
          {kickoff.toLocaleDateString(dateLocale, {
            day: 'numeric',
            month: 'short',
          })}{' '}
          ·{' '}
          {kickoff.toLocaleTimeString(dateLocale, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        <span className="text-xs text-ink-faint">
          {match.group ? `${t('group_label')} ${match.group}` : match.round}
        </span>
      </div>

      <div className="flex items-center justify-between px-2">
        <TeamLabel
          team={match.homeTeam}
          label={match.homeTeamLabel}
          locale={locale}
        />

        {match.status === 'FINISHED' || match.status === 'LIVE' ? (
          <div className="font-tabular text-3xl font-bold text-ink tabular-nums tracking-wider">
            {match.homeScore ?? '–'} : {match.awayScore ?? '–'}
          </div>
        ) : (
          <span className="text-ink-placeholder text-sm font-semibold px-2">
            vs
          </span>
        )}

        <TeamLabel
          team={match.awayTeam}
          label={match.awayTeamLabel}
          locale={locale}
        />
      </div>

      <div className="mt-2 flex justify-center">
        <StatusBadge status={match.status} locked={match.locked} t={t} />
      </div>

      {!canPredict &&
        match.status !== 'FINISHED' &&
        match.status !== 'LIVE' && (
          <p className="text-center text-xs text-ink-placeholder mt-3">
            {t('pred_teamsNotSet')}
          </p>
        )}

      {canPredict && (
        <div className="mt-4 border-t border-card-border/60 pt-4">
          {!editing && match.myPrediction ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-ink-body">
                  {t('pred_yourPrediction')}{' '}
                </span>
                <span className="font-tabular font-bold text-ink">
                  {home} : {away}
                </span>

                {match.myPrediction.pointsAwarded != null && (
                  <span
                    className={`mx-2 text-xs font-bold rounded-full px-2 py-0.5 ${
                      match.myPrediction.pointsAwarded > 0
                        ? 'bg-gold/15 text-gold-dark'
                        : 'bg-ink/5 text-ink-faint'
                    }`}
                  >
                    +{match.myPrediction.pointsAwarded} {t('pred_points')}
                  </span>
                )}
              </div>

              <button
                onClick={() => setEditing(true)}
                className="text-gold-dark text-sm font-semibold focus-ring"
              >
                {t('edit')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-6">
                <ScoreStepper value={home} onChange={setHome} t={t} />
                <span className="text-ink-placeholder font-bold">:</span>
                <ScoreStepper value={away} onChange={setAway} t={t} />
              </div>

              {err && (
                <p className="text-flare text-xs text-center">{err}</p>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="w-full bg-gold hover:bg-gold-dark transition-colors text-white font-bold rounded-xl py-2.5 focus-ring disabled:opacity-60"
              >
                {saving ? t('pred_saving') : t('pred_save')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreStepper({ value, onChange, t }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-full bg-card-border/40 text-ink text-lg font-bold flex items-center justify-center focus-ring"
        aria-label={t('pred_decrease')}
      >
        −
      </button>

      <span className="font-tabular text-2xl font-bold text-ink w-7 text-center">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(30, value + 1))}
        className="w-8 h-8 rounded-full bg-card-border/40 text-ink text-lg font-bold flex items-center justify-center focus-ring"
        aria-label={t('pred_increase')}
      >
        +
      </button>
    </div>
  );
}