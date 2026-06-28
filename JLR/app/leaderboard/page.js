'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Podium from '../../components/Podium';
import { useLocale } from '../../lib/i18n/LocaleContext';

function rankLabel(rank) {
  return `#${rank}`;
}

function stageLabel(stage, locale) {
  const ar = {
    'Round of 32': 'دور ٣٢',
    'Round of 16': 'دور ١٦',
    'Quarter-final': 'ربع النهائي',
    'Semi-final': 'نصف النهائي',
    Final: 'النهائي',
  };

  return locale === 'ar' ? ar[stage] || stage : stage;
}

export default function LeaderboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, locale } = useLocale();

  const [mode, setMode] = useState('overall');
  const [leaderboard, setLeaderboard] = useState(null);
  const [currentStage, setCurrentStage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    setLeaderboard(null);

    let qs = '';
    if (mode === 'current') qs = '?mode=current';
    if (mode === 'department') qs = '?mode=department';

    fetch(`/api/leaderboard${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setLeaderboard(d.leaderboard || []);
        setCurrentStage(
          locale === 'ar'
            ? d.currentStageAr || stageLabel(d.currentStage, locale)
            : d.currentStage || ''
        );
      });
  }, [mode, locale]);

  const top3 = leaderboard?.slice(0, 3);
  const rest = leaderboard?.slice(3);
  const participantCount = leaderboard?.length || 0;

  function displayName(item) {
    if (mode === 'department' && locale === 'ar') {
      return item.nameAr || item.name;
    }

    return item.name;
  }

  function deptName(dept) {
    if (!dept) return '';
    return locale === 'ar' ? dept.nameAr || dept.name : dept.name;
  }

  function pointsLabel() {
    if (mode === 'current') return locale === 'ar' ? 'نقاط الدور' : 'stage pts';
    return locale === 'ar' ? 'نقاط' : 'pts';
  }

  function subtitle() {
    if (mode === 'current') {
      return locale === 'ar'
        ? `ترتيب الدور الحالي: ${currentStage || ''}`
        : `Current stage ranking${currentStage ? `: ${currentStage}` : ''}`;
    }

    if (mode === 'department') {
      return locale === 'ar'
        ? 'ترتيب الأقسام حسب مجموع نقاط الموظفين'
        : 'Departments ranked by total employee points';
    }

    return t('leaderboard_subtitle');
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

        <p className="text-ink-faint text-xs mt-1">{subtitle()}</p>

        {leaderboard !== null && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/20 px-3 py-1.5">
            <span className="text-sm">👥</span>
            <span className="text-xs font-bold text-gold-dark">
              {mode === 'department'
                ? locale === 'ar'
                  ? `${participantCount} أقسام`
                  : `${participantCount} Departments`
                : locale === 'ar'
                  ? `${participantCount} مشارك`
                  : `${participantCount} Participants`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-card-soft rounded-full p-1 border border-card-border/60 shadow-sm">
        <button
          onClick={() => setMode('department')}
          className={`rounded-full py-2 text-xs font-semibold transition-colors focus-ring ${
            mode === 'department' ? 'bg-gold text-white shadow-sm' : 'text-ink-body'
          }`}
        >
          {locale === 'ar' ? 'حسب القسم' : 'Department'}
        </button>

        <button
          onClick={() => setMode('current')}
          className={`rounded-full py-2 text-xs font-semibold transition-colors focus-ring ${
            mode === 'current' ? 'bg-gold text-white shadow-sm' : 'text-ink-body'
          }`}
        >
          {locale === 'ar' ? 'الدور الحالي' : 'Current Stage'}
        </button>

        <button
          onClick={() => setMode('overall')}
          className={`rounded-full py-2 text-xs font-semibold transition-colors focus-ring ${
            mode === 'overall' ? 'bg-gold text-white shadow-sm' : 'text-ink-body'
          }`}
        >
          {locale === 'ar' ? 'العام' : 'Overall'}
        </button>
      </div>

      {mode === 'current' && currentStage && (
        <div className="rounded-2xl bg-gold/10 border border-gold/20 px-4 py-3">
          <p className="text-xs text-gold-dark font-bold">
            🏆{' '}
            {locale === 'ar'
              ? `المرشحون لجائزة الدور: ${currentStage}`
              : `Reward candidates for: ${currentStage}`}
          </p>

          <p className="text-[11px] text-ink-faint mt-1">
            {locale === 'ar'
              ? 'هذا الترتيب يعتمد على نقاط الدور الحالي فقط.'
              : 'This ranking uses points from the current stage only.'}
          </p>
        </div>
      )}

      {mode === 'department' && (
        <div className="rounded-2xl bg-gold/10 border border-gold/20 px-4 py-3">
          <p className="text-xs text-gold-dark font-bold">
            🏢 {locale === 'ar' ? 'ترتيب الأقسام' : 'Department Leaderboard'}
          </p>
          <p className="text-[11px] text-ink-faint mt-1">
            {locale === 'ar'
              ? 'يتم جمع نقاط جميع الموظفين داخل كل قسم.'
              : 'Total points are calculated by summing all employees in each department.'}
          </p>
        </div>
      )}

      {leaderboard === null && (
        <p className="text-ink-faint text-center py-10 text-sm">
          {t('loading')}
        </p>
      )}

      {leaderboard?.length === 0 && (
        <p className="text-ink-faint text-center py-10 text-sm">
          {t('leaderboard_noParticipants')}
        </p>
      )}

      {mode !== 'department' && top3?.length > 0 && (
        <div className="bg-gradient-to-br from-card-soft to-cream-deep border border-gold/20 rounded-card py-6 px-2 shadow-sm">
          <Podium top3={top3} />
        </div>
      )}

      {leaderboard?.length > 0 && (
        <div className="space-y-2">
          {(mode === 'department' ? leaderboard : rest).map((u) => (
            <div
              key={u.id}
              className="rounded-2xl bg-card-soft border border-card-border/60 shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <div className="w-10 text-center font-tabular text-sm font-bold text-gold-dark shrink-0">
                {rankLabel(u.rank)}
              </div>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white/60"
                style={{
                  backgroundColor: `${u.colorHex || u.department?.colorHex || '#9B6A43'}26`,
                  color: '#3A2C22',
                }}
              >
                {u.avatarLabel}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-bold truncate">
                  {displayName(u)}
                </p>

                {mode === 'department' ? (
                  <p className="text-ink-faint text-[11px] truncate">
                    {locale === 'ar'
                      ? `${u.participantCount || 0} موظف`
                      : `${u.participantCount || 0} employees`}
                  </p>
                ) : u.department ? (
                  <p className="text-ink-faint text-[11px] truncate">
                    {deptName(u.department)}
                  </p>
                ) : null}
              </div>

              <div className="text-end shrink-0">
                <p className="font-tabular text-gold-dark font-extrabold text-lg leading-none">
                  {u.totalPoints}
                </p>
                <p className="text-[10px] text-ink-faint mt-1">
                  {pointsLabel()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}