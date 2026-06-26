'use client';

import { useEffect, useState } from 'react';

const content = {
  en: {
    title: 'Prize Journey',
    subtitle: 'Each round gives you a separate chance to win based only on your points in that round.',
    fresh: 'Fresh chances',
    roundDraws: 'Round Draws',
    roundNote: 'Based on this round’s points only',
    prize: 'Prize',
    prizeStatus: 'Not finalized yet',
    prizeNote: 'The prize will be announced later — follow News & Announcements for updates.',
    rulesTitle: 'How winners are selected',
    winners: 'Winners',
    winner: 'Winner',
    employeeId: 'Employee ID',
    points: 'Points',
    ended: 'Ended',
    live: 'Live',
    inProgress: 'In progress',
    upcoming: 'Upcoming',
    announced: 'Finished',
    noWinnersYet: 'Winners will appear after the round ends.',
    rules: [
      'Each round’s points are calculated from that round’s matches only.',
      'The highest point holders in each round qualify for that round’s draw.',
      'Winning one draw does not stop you from joining the upcoming draws.',
      'Your overall ranking remains saved for the League Champions grand prize.'
    ],
    grandPrize: 'Grand Prize',
    leagueChampions: 'League Champions',
    grandDesc: 'Top 2 point holders at the end of the tournament.'
  },
  ar: {
    title: 'طريق الجوائز',
    subtitle: 'كل دور يمنحك فرصة مستقلة للفوز حسب نقاطك في ذلك الدور فقط.',
    fresh: 'فرص متجددة',
    roundDraws: 'سحوبات الأدوار',
    roundNote: 'حسب نقاط هذا الدور فقط',
    prize: 'الجائزة',
    prizeStatus: 'لم تُحدد بعد',
    prizeNote: 'سيتم الإعلان عنها لاحقًا — تابع الأخبار والإعلانات للمزيد.',
    rulesTitle: 'آلية اختيار الفائزين',
    winners: 'الفائزون',
    winner: 'الفائز',
    employeeId: 'الرقم الوظيفي',
    points: 'النقاط',
    ended: 'انتهى',
    live: 'مباشر',
    inProgress: 'جاري',
    upcoming: 'قادم',
    announced: 'تم الإعلان',
    noWinnersYet: 'سيظهر الفائزون بعد انتهاء الدور.',
    rules: [
      'يتم احتساب نقاط كل دور من مباريات ذلك الدور فقط.',
      'أصحاب أعلى النقاط في كل دور يدخلون السحب الخاص بذلك الدور.',
      'الفوز في أحد السحوبات لا يمنعك من المشاركة في السحوبات القادمة.',
      'يبقى ترتيبك العام محفوظًا لجائزة أبطال الدوري في نهاية البطولة.'
    ],
    grandPrize: 'الجائزة الكبرى',
    leagueChampions: 'أبطال الدوري',
    grandDesc: 'أعلى 2 نقاط في نهاية البطولة.'
  }
};

const fallbackRounds = [
  {
    key: 'r32',
    winnersCount: 2,
    labels: { en: 'Round of 32', ar: 'دور 32' },
    status: 'upcoming',
    winners: []
  },
  {
    key: 'r16',
    winnersCount: 1,
    labels: { en: 'Round of 16', ar: 'دور 16' },
    status: 'upcoming',
    winners: []
  },
  {
    key: 'qf',
    winnersCount: 1,
    labels: { en: 'Quarter-finals', ar: 'ربع النهائي' },
    status: 'upcoming',
    winners: []
  },
  {
    key: 'sf',
    winnersCount: 1,
    labels: { en: 'Semi-finals', ar: 'نصف النهائي' },
    status: 'upcoming',
    winners: []
  },
  {
    key: 'final',
    winnersCount: 1,
    labels: { en: 'Final', ar: 'النهائي' },
    status: 'upcoming',
    winners: []
  }
];

function getSavedLanguage() {
  if (typeof window === 'undefined') return 'en';

  const htmlLang = document.documentElement.lang;
  const htmlDir = document.documentElement.dir;

  if (htmlLang === 'ar' || htmlDir === 'rtl') return 'ar';
  if (htmlLang === 'en' || htmlDir === 'ltr') return 'en';

  const possibleValues = Object.keys(window.localStorage)
    .map((key) => window.localStorage.getItem(key))
    .filter(Boolean);

  if (possibleValues.includes('ar')) return 'ar';
  if (possibleValues.includes('en')) return 'en';

  return 'en';
}

function getStatusText(status, t) {
  if (status === 'announced') return t.announced;
  if (status === 'ended') return t.ended;
  if (status === 'live') return t.live;
  if (status === 'in_progress') return t.inProgress;
  return t.upcoming;
}

export default function RewardsPage() {
  const [language, setLanguage] = useState('en');
  const [rounds, setRounds] = useState(fallbackRounds);

  useEffect(() => {
    const updateLanguage = () => setLanguage(getSavedLanguage());

    updateLanguage();
    const interval = setInterval(updateLanguage, 300);

    fetch('/api/rewards', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.rounds)) {
          setRounds(data.rounds);
        }
      })
      .catch(() => {
        setRounds(fallbackRounds);
      });

    return () => clearInterval(interval);
  }, []);

  const t = content[language] || content.en;
  const isArabic = language === 'ar';

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-28 pt-8"
    >
      <section className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand/10 text-3xl">
          🎁
        </div>
        <h1 className="text-3xl font-bold text-ink-heading">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-muted">
          {t.subtitle}
        </p>
      </section>

      <section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-ink-heading">{t.rulesTitle}</h2>

        <ul className="space-y-3 text-sm leading-7 text-ink-muted">
          {t.rules.map((rule) => (
            <li key={rule} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-900">
            {t.fresh}
          </span>
          <h2 className="text-xl font-bold text-ink-heading">{t.roundDraws}</h2>
        </div>

        <div className="space-y-3">
          {rounds.map((round, index) => (
            <div
              key={round.key}
              className="rounded-3xl border border-card-border/70 bg-white px-5 py-4 shadow-sm"
            >
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold text-brand">
                  {index + 1}
                </div>

                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <p className="text-base font-bold text-ink-heading">
                    {round.labels?.[language] || round.labels?.en}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t.roundNote}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">
                    {round.winnersCount === 2
                      ? isArabic
                        ? '2 فائزين'
                        : '2 winners'
                      : isArabic
                        ? 'فائز واحد'
                        : '1 winner'}
                  </span>

                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    {getStatusText(round.status, t)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-cream/60 p-4">
                <p className="mb-3 text-sm font-bold text-ink-heading">
                  {round.winnersCount === 2 ? t.winners : t.winner}
                </p>

                {round.winners?.length ? (
                  <div className="space-y-2">
                    {round.winners.map((winner, winnerIndex) => (
                      <div
                        key={`${winner.employeeCode}-${winnerIndex}`}
                        className="rounded-2xl border border-card-border/60 bg-white px-4 py-3"
                      >
                        <p className="font-bold text-ink-heading">
                          {winnerIndex + 1}. {winner.name}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {t.employeeId}: {winner.employeeCode}
                        </p>
                        <p className="mt-1 text-xs font-bold text-brand">
                          {t.points}: {winner.points}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">{t.noWinnersYet}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-dashed border-card-border bg-white/60 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
            🎁
          </div>
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <p className="text-sm font-bold text-brand">{t.prize}</p>
            <h2 className="mt-1 text-xl font-bold text-ink-heading">
              {t.prizeStatus}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {t.prizeNote}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">
        <p className="mb-4 text-lg font-bold text-ink-heading">
          🏆 {t.grandPrize}
        </p>

        <div className="rounded-[1.75rem] border border-card-border/70 bg-white p-6 shadow-sm">
          <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-bold text-brand">
            {t.grandPrize}
          </span>

          <h2 className="mt-5 text-2xl font-bold text-ink-heading">
            {t.leagueChampions}
          </h2>

          <p className="mt-2 text-sm text-ink-muted">{t.grandDesc}</p>
        </div>
      </section>
    </main>
  );
}
