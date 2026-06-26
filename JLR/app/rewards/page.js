'use client';

const rounds = [
  { name: 'Round of 32', winners: '2 winners' },
  { name: 'Round of 16', winners: '1 winner' },
  { name: 'Quarter-finals', winners: '1 winner' },
  { name: 'Semi-finals', winners: '1 winner' },
  { name: 'Final', winners: '1 winner' }
];

const rules = [
  'Each round’s points are calculated from that round’s matches only.',
  'The highest point holders in each round qualify for that round’s draw.',
  'Winning one draw does not stop you from joining the upcoming draws.',
  'Your overall ranking remains saved for the League Champions grand prize.'
];

export default function RewardsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-28 pt-8">
      <section className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand/10 text-3xl">
          🎁
        </div>
        <h1 className="text-3xl font-bold text-ink-heading">Prize Journey</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-muted">
          Each round gives you a separate chance to win based only on your points in that round.
        </p>
      </section>

      <section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-900">
            Fresh chances
          </span>
          <h2 className="text-xl font-bold text-ink-heading">Round Draws</h2>
        </div>

        <div className="space-y-3">
          {rounds.map((round, index) => (
            <div
              key={round.name}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-3xl border border-card-border/70 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold text-brand">
                {index + 1}
              </div>

              <div className="text-left">
                <p className="text-base font-bold text-ink-heading">{round.name}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Based on this round’s points only
                </p>
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
          <div className="text-left">
            <p className="text-sm font-bold text-brand">Prize</p>
            <h2 className="mt-1 text-xl font-bold text-ink-heading">
              Not finalized yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              The prize will be announced later — follow News & Announcements for updates.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-ink-heading">
          How winners are selected
        </h2>

        <ul className="space-y-3 text-sm leading-7 text-ink-muted">
          {rules.map((rule) => (
            <li key={rule} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[2rem] border border-card-border/70 bg-white/75 p-5 shadow-sm">
        <p className="mb-4 text-lg font-bold text-ink-heading">
          🏆 Grand Prize
        </p>

        <div className="rounded-[1.75rem] border border-card-border/70 bg-white p-6 shadow-sm">
          <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-bold text-brand">
            Grand Prize
          </span>

          <h2 className="mt-5 text-2xl font-bold text-ink-heading">
            League Champions
          </h2>

          <p className="mt-2 text-sm text-ink-muted">
            Top 2 point holders at the end of the tournament.
          </p>
        </div>
      </section>
    </main>
  );
}
