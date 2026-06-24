'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Podium from '../../components/Podium';
import { useLocale } from '../../lib/i18n/LocaleContext';

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function LeaderboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [mode, setMode] = useState('overall');
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments || []));
  }, []);

  useEffect(() => {
    setLeaderboard(null);
    const qs = mode === 'department' && selectedDept ? `?departmentId=${selectedDept}` : '';

    fetch(`/api/leaderboard${qs}`)
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []));
  }, [mode, selectedDept]);

  const top3 = leaderboard?.slice(0, 3);
  const rest = leaderboard?.slice(3);

  function deptName(dept) {
    if (!dept) return '';
    return locale === 'ar' ? dept.nameAr || dept.name : dept.name;
  }

  return (
    <div className="px-4 pt-4 space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.22em] uppercase text-gold-eyebrow font-bold mb-1">
          JLR WORLD CUP 2026
        </p>
        <h2 className="font-display font-bold text-2xl text-ink">
          {t('leaderboard_title')}
        </h2>
        <p className="text-ink-faint text-xs mt-1">
          {t('leaderboard_subtitle')}
        </p>
      </div>

      <div className="flex gap-2 bg-card-soft rounded-full p-1 border border-card-border/60 shadow-sm">
        <button
          onClick={() => setMode('overall')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors focus-ring ${
            mode === 'overall' ? 'bg-gold text-white shadow-sm' : 'text-ink-body'
          }`}
        >
          {t('leaderboard_overall')}
        </button>

        <button
          onClick={() => setMode('department')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors focus-ring ${
            mode === 'department' ? 'bg-gold text-white shadow-sm' : 'text-ink-body'
          }`}
        >
          {t('leaderboard_byDept')}
        </button>
      </div>

      {mode === 'department' && (
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full rounded-xl bg-card-soft border border-card-border/60 text-ink px-4 py-2.5 text-sm focus-ring shadow-sm"
        >
          <option value="">{t('leaderboard_chooseDept')}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {deptName(d)} ({d.userCount})
            </option>
          ))}
        </select>
      )}

      {leaderboard === null && (
        <p className="text-ink-faint text-center py-10 text-sm">{t('loading')}</p>
      )}

      {leaderboard?.length === 0 && (
        <p className="text-ink-faint text-center py-10 text-sm">
          {t('leaderboard_noParticipants')}
        </p>
      )}

      {top3?.length > 0 && (
        <div className="bg-gradient-to-br from-card-soft to-cream-deep border border-gold/20 rounded-card py-6 px-2 shadow-sm">
          <Podium top3={top3} />
        </div>
      )}

      {rest?.length > 0 && (
        <div className="space-y-2">
          {rest.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl bg-card-soft border border-card-border/60 shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <div className="w-10 text-center font-tabular text-sm font-bold text-gold-dark shrink-0">
                {medal(u.rank)}
              </div>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white/60"
                style={{
                  backgroundColor: `${u.department?.colorHex || '#9B6A43'}26`,
                  color: '#3A2C22',
                }}
              >
                {u.avatarLabel}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-bold truncate">{u.name}</p>
                {u.department && (
                  <p className="text-ink-faint text-[11px] truncate">
                    {deptName(u.department)}
                  </p>
                )}
              </div>

              <div className="text-end shrink-0">
                <p className="font-tabular text-gold-dark font-extrabold text-lg leading-none">
                  {u.totalPoints}
                </p>
                <p className="text-[10px] text-ink-faint mt-1">
                  pts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}