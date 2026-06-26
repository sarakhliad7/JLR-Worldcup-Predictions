'use client';

import { useEffect, useState } from 'react';

const content = {
  en: {
    title: 'Prize Journey',
    subtitle: 'Each round gives you a separate chance to win based only on your points in that round.',
    fresh: 'Fresh chances',
    roundDraws: 'Round Draws',
    roundNote: 'Based on this round’s points only',
    rounds: [
      { name: 'Round of 32', winners: '2 winners' },
      { name: 'Round of 16', winners: '1 winner' },
      { name: 'Quarter-finals', winners: '1 winner' },
      { name: 'Semi-finals', winners: '1 winner' },
      { name: 'Final', winners: '1 winner' }
    ],
    prize: 'Prize',
    prizeStatus: 'Not finalized yet',
    prizeNote: 'The prize will be announced later — follow News & Announcements for updates.',
    rulesTitle: 'How winners are selected',
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
    rounds: [
      { name: 'دور 32', winners: '2 فائزين' },
      { name: 'دور 16', winners: 'فائز واحد' },
      { name: 'ربع النهائي', winners: 'فائز واحد' },
      { name: 'نصف النهائي', winners: 'فائز واحد' },
      { name: 'النهائي', winners: 'فائز واحد' }
    ],
    prize: 'الجائزة',
    prizeStatus: 'لم تُحدد بعد',
    prizeNote: 'سيتم الإعلان عنها لاحقًا — تابع الأخبار والإعلانات للمزيد.',
    rulesTitle: 'آلية اختيار الفائزين',
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

function getSavedLanguage() {
  if (typeof window === 'undefined') return 'en';

  const keys = ['language', 'lang', 'locale', 'jlr-language', 'app-language'];

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value === 'ar' || value === 'en') return value;
  }

  const htmlLang = document.documentElement.lang;
  if (htmlLang === 'ar' || htmlLang === 'en') return htmlLang;

  return 'en';
}

export default function RewardsPage() {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    setLanguage(getSavedLanguage());
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
          {t.rounds.map((round, index) => (
            <div
              key={round.name}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-3xl border border-card-border/70 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold text-brand">
                {index + 1}
              </div>

              <div className={isArabic ? 'text-right' : 'text-left'}>
                <p className="text-base font-bold text-ink-heading">{round.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{t.roundNote}</p>
              </div>

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">
                {round.winners}
              </span>
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
