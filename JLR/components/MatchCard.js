'use client';

import { useState } from 'react';
import { useLocale } from '../lib/i18n/LocaleContext';

const FLAG_CODES = {
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Belgium: 'be',
  Brazil: 'br',
  Canada: 'ca',
  Colombia: 'co',
  Croatia: 'hr',
  Denmark: 'dk',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Iran: 'ir',
  Italy: 'it',
  Japan: 'jp',
  Jordan: 'jo',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  Norway: 'no',
  Paraguay: 'py',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  'South Africa': 'za',
  'South Korea': 'kr',
  Spain: 'es',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  Uruguay: 'uy',
  USA: 'us',
  'United States': 'us',
  'United States of America': 'us',
  Czechia: 'cz',
  'Czech Republic': 'cz',
  'Bosnia & Herzegovina': 'ba',
  'Bosnia and Herzegovina': 'ba',
  'New Zealand': 'nz',
  Haiti: 'ht',
  Curaçao: 'cw',
  Curacao: 'cw',
  Sweden: 'se',
  'Cape Verde': 'cv',
  Senegal: 'sn',
  'Ivory Coast': 'ci',
  'Côte d’Ivoire': 'ci',
  'Cote dIvoire': 'ci',
  'Costa Rica': 'cr',
  Panama: 'pa',
  Algeria: 'dz',
  Nigeria: 'ng',
};

const CODE_TO_FLAG = {
  AR: 'ar', AU: 'au', AT: 'at', BE: 'be', BR: 'br', CA: 'ca', CH: 'ch',
  CO: 'co', HR: 'hr', DK: 'dk', EC: 'ec', EG: 'eg', FR: 'fr', DE: 'de',
  GH: 'gh', IR: 'ir', IT: 'it', JP: 'jp', JO: 'jo', MX: 'mx', MA: 'ma',
  NL: 'nl', NO: 'no', PY: 'py', PT: 'pt', QA: 'qa', SA: 'sa', ZA: 'za',
  KR: 'kr', ES: 'es', TN: 'tn', TR: 'tr', UY: 'uy', US: 'us', USA: 'us',
  CZ: 'cz', BA: 'ba', NZ: 'nz', HT: 'ht', CW: 'cw', SE: 'se', CV: 'cv',
  SN: 'sn', CI: 'ci', CR: 'cr', PA: 'pa', DZ: 'dz', NG: 'ng',
};

function normalizeTeamName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
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

  return locale === 'ar' ? team.nameAr || englishName : englishName;
}

function getFlagCode(team, locale) {
  if (!team) return '';

  const names = [
    team.nameEn,
    team.name,
    team.teamName,
    team.country,
    team.label,
    getTeamName(team, locale),
  ]
    .filter(Boolean)
    .map(normalizeTeamName);

  for (const name of names) {
    if (FLAG_CODES[name]) return FLAG_CODES[name];
  }

  const raw = String(team.flagEmoji || '').trim().toUpperCase();
  if (CODE_TO_FLAG[raw]) return CODE_TO_FLAG[raw];

  return '';
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
    const flagCode = getFlagCode(team, locale);

    return (
      <div className="flex flex-col items-center gap-1.5 w-20">
        {flagCode ? (
          <img
            src={`https://flagcdn.com/w80/${flagCode}.png`}
            alt={name}
            className="w-9 h-6 object-cover rounded-sm shadow-sm"
          />
        ) : (
          <span className="text-2xl leading-none opacity-40">⚽</span>
        )}

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
          {kickoff.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })} ·{' '}
          {kickoff.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
        </span>

        <span className="text-xs text-ink-faint">
          {match.group ? `${t('group_label')} ${match.group}` : match.round}
        </span>
      </div>

      <div className="flex items-center justify-between px-2">
        <TeamLabel team={match.homeTeam} label={match.homeTeamLabel} locale={locale} />

        {match.status === 'FINISHED' || match.status === 'LIVE' ? (
          <div className="font-tabular text-3xl font-bold text-ink tabular-nums tracking-wider">
            {match.homeScore ?? '–'} : {match.awayScore ?? '–'}
          </div>
        ) : (
          <span className="text-ink-placeholder text-sm font-semibold px-2">vs</span>
        )}

        <TeamLabel team={match.awayTeam} label={match.awayTeamLabel} locale={locale} />
      </div>

      <div className="mt-2 flex justify-center">
        <StatusBadge status={match.status} locked={match.locked} t={t} />
      </div>

      {!canPredict && match.status !== 'FINISHED' && match.status !== 'LIVE' && (
        <p className="text-center text-xs text-ink-placeholder mt-3">
          {t('pred_teamsNotSet')}
        </p>
      )}

      {canPredict && (
        <div className="mt-4 border-t border-card-border/60 pt-4">
          {!editing && match.myPrediction ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-ink-body">{t('pred_yourPrediction')} </span>
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

              {err && <p className="text-flare text-xs text-center">{err}</p>}

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