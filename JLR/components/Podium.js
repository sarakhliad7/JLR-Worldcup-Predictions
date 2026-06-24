'use client';

const STEP_HEIGHT = { 1: 'h-24', 2: 'h-20', 3: 'h-18' };
const ORDER = [2, 1, 3];

function rankBadge(rank) {
  if (rank === 1) return '#1';
  if (rank === 2) return '#2';
  if (rank === 3) return '#3';
  return `#${rank}`;
}

function badgeClass(rank) {
  if (rank === 1) return 'border-gold text-gold-dark bg-gold/10';
  if (rank === 2) return 'border-ink-faint/40 text-ink-body bg-white/50';
  return 'border-terracotta text-terracotta bg-terracotta/10';
}

export default function Podium({ top3 }) {
  if (!top3 || top3.length === 0) return null;

  const byRank = Object.fromEntries(top3.map((u) => [u.rank, u]));

  return (
    <div className="flex items-end justify-center gap-2 px-1">
      {ORDER.map((rank) => {
        const u = byRank[rank];

        if (!u) return <div key={rank} className="flex-1" />;

        return (
          <div key={rank} className="flex-1 flex flex-col items-center min-w-0">
            <div
              className={`mb-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 shadow-sm ${badgeClass(
                rank
              )}`}
            >
              {rankBadge(rank)}
            </div>

            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm mb-2 border-2 shadow-sm"
              style={{
                backgroundColor: `${u.department?.colorHex || '#9B6A43'}26`,
                borderColor: u.department?.colorHex || '#9B6A43',
                color: '#3A2C22',
              }}
            >
              {u.avatarLabel}
            </div>

            <p className="text-xs text-ink text-center font-bold leading-tight mb-2 line-clamp-1 max-w-[90px]">
              {u.name}
            </p>

            <div
              className={`w-full rounded-t-2xl flex flex-col items-center justify-start pt-2 ${STEP_HEIGHT[rank]} ${
                rank === 1
                  ? 'bg-gold'
                  : rank === 2
                  ? 'bg-terracotta'
                  : 'bg-card-border'
              }`}
            >
              <span className="font-display font-extrabold text-lg text-white">
                {rankBadge(rank)}
              </span>

              <span className="text-white text-xs font-bold mt-1">
                {u.totalPoints} pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}