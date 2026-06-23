'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '../../../lib/i18n/LocaleContext';

const DEFAULT_FORM = { round: '', group: '', kickoffAt: '', venue: '', homeTeamId: '', awayTeamId: '' };

export default function AdminMatchesPage() {
  const { t, locale } = useLocale();
  const [matches, setMatches] = useState(null);
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resultDrafts, setResultDrafts] = useState({});
  const [savingResultId, setSavingResultId] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  function teamName(team) {
    if (!team) return '';
    return locale === 'ar' ? team.nameAr || team.nameEn : team.nameEn;
  }

  async function load() {
    const res = await fetch('/api/admin/matches').then((r) => r.json());
    setMatches(res.matches || []);
    setTeams(res.teams || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createMatch() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(t(data.error));
      setShowForm(false);
      setForm(DEFAULT_FORM);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveResult(match) {
    const draft = resultDrafts[match.id];
    if (!draft || draft.home === '' || draft.away === '') return;
    setSavingResultId(match.id);
    setResultMessage('');
    try {
      const res = await fetch(`/api/admin/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: Number(draft.home), awayScore: Number(draft.away) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(t(data.error));
      setResultMessage(`${t('admin_matches_resultSaved')} (${data.predictionsScored})`);
      load();
    } catch (e) {
      setResultMessage(e.message);
    } finally {
      setSavingResultId(null);
    }
  }

  async function removeMatch(match) {
    if (!confirm(t('admin_matches_deleteConfirm'))) return;
    await fetch(`/api/admin/matches/${match.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">{t('admin_matches_title')}</h1>
          <p className="text-ink-faint text-sm mt-1">{t('admin_matches_subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-xl bg-gold text-white px-4 py-2.5 text-sm font-semibold hover:bg-gold-dark focus-ring"
        >
          {t('admin_matches_add')}
        </button>
      </div>

      {showForm && (
        <div className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-5 space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('admin_matches_round')}>
              <input
                value={form.round}
                onChange={(e) => setForm({ ...form, round: e.target.value })}
                placeholder="e.g. Round of 16"
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
            <Field label={t('admin_matches_group')}>
              <input
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                placeholder="A"
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
            <Field label={t('admin_matches_homeTeam')}>
              <select
                value={form.homeTeamId}
                onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              >
                <option value="">—</option>
                {teams.map((tm) => (
                  <option key={tm.id} value={tm.id}>{teamName(tm)}</option>
                ))}
              </select>
            </Field>
            <Field label={t('admin_matches_awayTeam')}>
              <select
                value={form.awayTeamId}
                onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              >
                <option value="">—</option>
                {teams.map((tm) => (
                  <option key={tm.id} value={tm.id}>{teamName(tm)}</option>
                ))}
              </select>
            </Field>
            <Field label={t('admin_matches_kickoff')}>
              <input
                type="datetime-local"
                value={form.kickoffAt}
                onChange={(e) => setForm({ ...form, kickoffAt: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
            <Field label={t('admin_matches_venue')}>
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
          </div>
          {error && <p className="text-flare text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={createMatch}
              disabled={saving}
              className="rounded-xl bg-gold text-white px-4 py-2 text-sm font-semibold hover:bg-gold-dark focus-ring disabled:opacity-60"
            >
              {t('save')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-white/60 border border-card-border/60 px-4 py-2 text-sm font-semibold text-ink-body focus-ring"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {resultMessage && (
        <p className="text-sm text-gold-dark font-semibold">{resultMessage}</p>
      )}

      <div className="space-y-3">
        {matches?.map((m) => {
          const draft = resultDrafts[m.id] || { home: m.homeScore ?? '', away: m.awayScore ?? '' };
          return (
            <div key={m.id} className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-ink-faint mb-1">
                  {m.round} {m.group ? `· ${t('group_label')} ${m.group}` : ''} · {new Date(m.kickoffAt).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="font-semibold text-ink">
                  {teamName(m.homeTeam) || m.homeTeamLabel || '—'} vs {teamName(m.awayTeam) || m.awayTeamLabel || '—'}
                </p>
                {m.resultSource === 'ADMIN' && (
                  <span className="text-[11px] text-gold-dark font-semibold">admin-entered result</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={draft.home}
                  onChange={(e) => setResultDrafts({ ...resultDrafts, [m.id]: { ...draft, home: e.target.value } })}
                  className="w-16 rounded-lg border border-card-border/60 bg-white/60 px-2 py-1.5 text-sm text-center focus-ring"
                  placeholder={t('admin_matches_homeScore')}
                />
                <span className="text-ink-faint">:</span>
                <input
                  type="number"
                  min="0"
                  value={draft.away}
                  onChange={(e) => setResultDrafts({ ...resultDrafts, [m.id]: { ...draft, away: e.target.value } })}
                  className="w-16 rounded-lg border border-card-border/60 bg-white/60 px-2 py-1.5 text-sm text-center focus-ring"
                  placeholder={t('admin_matches_awayScore')}
                />
                <button
                  onClick={() => saveResult(m)}
                  disabled={savingResultId === m.id}
                  className="rounded-lg bg-gold text-white px-3 py-1.5 text-xs font-semibold hover:bg-gold-dark focus-ring disabled:opacity-60 whitespace-nowrap"
                >
                  {savingResultId === m.id ? t('admin_matches_recalculating') : t('admin_matches_enterResult')}
                </button>
                <button onClick={() => removeMatch(m)} className="text-flare text-xs font-semibold focus-ring">
                  {t('admin_employees_delete')}
                </button>
              </div>
            </div>
          );
        })}
        {matches?.length === 0 && (
          <p className="text-ink-faint text-center py-10 text-sm">{t('pred_noMatches')}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-label mb-1">{label}</span>
      {children}
    </label>
  );
}
